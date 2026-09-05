import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where
} from "firebase/firestore";
import { appDb, getOptionalTable } from "@/db/dexie";
import { syncRepository } from "@/db/repositories/sync-repository";
import { firestore } from "@/lib/firebase-client";
import {
  SYNC_ENTITY_NAMES,
  clearCheckpoints,
  clearLegacyCheckpoints,
  getCheckpoint,
  setCheckpoint
} from "@/services/sync-checkpoints";
import { shouldApplyRemoteRecord, toIsoTimestamp } from "@/services/sync-merge";
import type {
  Account,
  AppSettings,
  Category,
  NotificationPreference,
  SyncableEntity,
  SyncEntityName,
  SyncOperationRecord,
  SyncRunResult,
  TransferRecord,
  TransactionRecord
} from "@/types";
import { nowIso } from "@/utils/date-utils";

type SyncableRecord =
  | Account
  | Category
  | TransactionRecord
  | TransferRecord
  | AppSettings
  | NotificationPreference;

function assertFirestore() {
  if (!firestore) {
    throw new Error("Firestore is not configured.");
  }

  return firestore;
}

function getSyncTable(entityName: SyncEntityName) {
  if (entityName === "accounts") {
    return appDb.accounts;
  }

  if (entityName === "categories") {
    return appDb.categories;
  }

  if (entityName === "transactions") {
    return appDb.transactions;
  }

  if (entityName === "transfers") {
    const transfersTable = getOptionalTable<TransferRecord>("transfers");
    if (!transfersTable) {
      throw new Error("Transfers table is unavailable. Refresh the app and sign in again.");
    }

    return transfersTable;
  }

  if (entityName === "settings") {
    return appDb.settings;
  }

  return appDb.notificationPreferences;
}

// Firestore is schemaless, so records are stored with the app's camelCase field
// names directly — no snake_case mapping. Only the local-only sync bookkeeping is
// stripped. This keeps the Firestore shape identical to what the WhatsApp chatbot
// will write.
function toRemoteDoc(record: SyncableRecord) {
  const {
    remoteId: _remoteId,
    syncStatus: _syncStatus,
    syncError: _syncError,
    lastSyncedAt: _lastSyncedAt,
    ...rest
  } = record as SyncableRecord & Partial<SyncableEntity>;
  void _remoteId;
  void _syncStatus;
  void _syncError;
  void _lastSyncedAt;
  return rest;
}

function fromRemoteDoc(entityName: SyncEntityName, data: Record<string, unknown>): SyncableRecord {
  const base = {
    ...data,
    updatedAt: toIsoTimestamp(data.updatedAt),
    remoteId: String(data.id),
    syncStatus: "synced" as const,
    syncError: null,
    lastSyncedAt: nowIso()
  };

  // settings + notificationPreferences never carry deletedAt.
  if (entityName === "settings" || entityName === "notificationPreferences") {
    delete (base as Record<string, unknown>).deletedAt;
  }

  return base as unknown as SyncableRecord;
}

async function markLocalSynced(entityName: SyncEntityName, entityId: string, remoteId: string) {
  const table = getSyncTable(entityName) as { get: (id: string) => Promise<SyncableRecord | undefined>; put: (record: SyncableRecord) => Promise<unknown> };
  const record = await table.get(entityId);
  if (!record) {
    return;
  }

  await table.put({
    ...record,
    remoteId,
    syncStatus: "synced",
    syncError: null,
    lastSyncedAt: nowIso()
  });
}

async function markLocalFailed(entityName: SyncEntityName, entityId: string, errorMessage: string) {
  const table = getSyncTable(entityName) as { get: (id: string) => Promise<SyncableRecord | undefined>; put: (record: SyncableRecord) => Promise<unknown> };
  const record = await table.get(entityId);
  if (!record) {
    return;
  }

  await table.put({
    ...record,
    syncStatus: "failed",
    syncError: errorMessage
  });
}

async function pushOperation(operation: SyncOperationRecord, userId: string) {
  const db = assertFirestore();
  const table = getSyncTable(operation.entityName);
  const record = (await table.get(operation.entityId)) as SyncableRecord | undefined;

  if (!record) {
    await syncRepository.remove(operation.id);
    return;
  }

  if (!record.userId) {
    throw new Error("Local record is missing authenticated ownership.");
  }

  // Left behind by a different account on this browser. Pushing it would file
  // their record under this user's uid, so drop the operation instead.
  if (record.userId !== userId) {
    await syncRepository.remove(operation.id);
    return;
  }

  await syncRepository.markProcessing(operation.id);

  try {
    const ref = doc(db, "users", userId, operation.entityName, record.id);
    await setDoc(ref, toRemoteDoc(record), { merge: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    await markLocalFailed(operation.entityName, operation.entityId, message);
    await syncRepository.markFailed(operation.id, message);
    throw new Error(message);
  }

  await markLocalSynced(operation.entityName, operation.entityId, record.id);
  await syncRepository.remove(operation.id);
}

/**
 * How many rows of this entity already belong to the signed-in user. A cursor is
 * only meaningful next to the rows it was earned against: when this device holds
 * none of the user's data (fresh browser, evicted IndexedDB, "Reset app data", or
 * a browser previously used by someone else), an inherited cursor would skip
 * their entire remote history and leave the app showing an empty ledger. In that
 * state the cursor is ignored and the pull starts from the beginning.
 */
async function countOwnedRecords(entityName: SyncEntityName, userId: string) {
  const table = getSyncTable(entityName) as unknown as {
    where: (index: string) => { equals: (value: string) => { count: () => Promise<number> } };
  };

  try {
    return await table.where("userId").equals(userId).count();
  } catch {
    // A missing index must never block the pull — assume nothing is owned, which
    // only costs one full pull.
    return 0;
  }
}

async function resolveCheckpoint(entityName: SyncEntityName, userId: string) {
  const checkpoint = getCheckpoint(entityName, userId);
  if (!checkpoint) {
    return null;
  }

  const owned = await countOwnedRecords(entityName, userId);
  if (owned > 0) {
    return checkpoint;
  }

  clearCheckpoints(userId);
  return null;
}

async function pullTable(entityName: SyncEntityName, userId: string) {
  const db = assertFirestore();
  const checkpoint = await resolveCheckpoint(entityName, userId);
  const collectionRef = collection(db, "users", userId, entityName);
  const constraints = checkpoint
    ? [where("updatedAt", ">", checkpoint), orderBy("updatedAt", "asc")]
    : [orderBy("updatedAt", "asc")];

  const snapshot = await getDocs(query(collectionRef, ...constraints));
  const table = getSyncTable(entityName);

  let latestUpdatedAt: string | null = null;

  for (const document of snapshot.docs) {
    const data = document.data() as Record<string, unknown>;
    const remoteRecord = fromRemoteDoc(entityName, data);
    const localRecord = (await table.get(remoteRecord.id)) as SyncableRecord | undefined;

    if (shouldApplyRemoteRecord(remoteRecord.updatedAt, localRecord?.updatedAt)) {
      await table.put(remoteRecord as never);
    }

    latestUpdatedAt = remoteRecord.updatedAt;
  }

  if (latestUpdatedAt) {
    setCheckpoint(entityName, userId, latestUpdatedAt);
  }

  return snapshot.size;
}

export const syncEngine = {
  /**
   * Pushes queued local changes, then pulls the account's remote records.
   * `pulled` reports whether the pull actually completed: callers must not treat
   * local state as this account's true state when it is false, or an offline
   * sign-in looks indistinguishable from an empty account.
   */
  async run(userId: string): Promise<SyncRunResult> {
    if (!navigator.onLine || !firestore) {
      return { ...(await syncRepository.summarize()), pulled: false };
    }

    clearLegacyCheckpoints();

    const pendingOperations = await syncRepository.listPending();

    for (const operation of pendingOperations) {
      try {
        await pushOperation(operation, userId);
      } catch {
        // The local failure state has already been recorded, so the loop can continue.
      }
    }

    await Promise.all(SYNC_ENTITY_NAMES.map((entityName) => pullTable(entityName, userId)));

    return { ...(await syncRepository.summarize()), pulled: true };
  }
};

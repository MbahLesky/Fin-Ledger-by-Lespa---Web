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
import type {
  Account,
  AppSettings,
  Category,
  NotificationPreference,
  SyncableEntity,
  SyncEntityName,
  SyncOperationRecord,
  TransferRecord,
  TransactionRecord
} from "@/types";
import { nowIso } from "@/utils/date-utils";

// Checkpoint prefix is bumped from the old Supabase engine ("finance-ledger-*") so
// the one-time backend switch starts each entity's pull cursor fresh.
const CHECKPOINT_PREFIX = "monilog-firestore-checkpoint";

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

function getCheckpointKey(entityName: SyncEntityName) {
  return `${CHECKPOINT_PREFIX}:${entityName}`;
}

function getCheckpoint(entityName: SyncEntityName) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(getCheckpointKey(entityName));
}

function setCheckpoint(entityName: SyncEntityName, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getCheckpointKey(entityName), value);
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

async function pullTable(entityName: SyncEntityName, userId: string) {
  const db = assertFirestore();
  const checkpoint = getCheckpoint(entityName);
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

    if (!localRecord || remoteRecord.updatedAt >= localRecord.updatedAt) {
      await table.put(remoteRecord as never);
    }

    if (typeof data.updatedAt === "string") {
      latestUpdatedAt = data.updatedAt;
    }
  }

  if (latestUpdatedAt) {
    setCheckpoint(entityName, latestUpdatedAt);
  }
}

export const syncEngine = {
  async run(userId: string) {
    if (!navigator.onLine || !firestore) {
      return syncRepository.summarize();
    }

    const pendingOperations = await syncRepository.listPending();

    for (const operation of pendingOperations) {
      try {
        await pushOperation(operation, userId);
      } catch {
        // The local failure state has already been recorded, so the loop can continue.
      }
    }

    await Promise.all([
      pullTable("accounts", userId),
      pullTable("categories", userId),
      pullTable("transactions", userId),
      pullTable("transfers", userId),
      pullTable("settings", userId),
      pullTable("notificationPreferences", userId)
    ]);

    return syncRepository.summarize();
  }
};

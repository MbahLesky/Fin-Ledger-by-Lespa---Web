import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { appDb, getOptionalTable } from "@/db/dexie";
import { syncRepository } from "@/db/repositories/sync-repository";
import { firestore } from "@/lib/firebase-client";
import {
  SYNC_ENTITY_NAMES,
  clearLegacyCheckpoints,
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

interface PullOutcome {
  entityName: SyncEntityName;
  fetched: number;
  applied: number;
  skipped: number;
}

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

function fromRemoteDoc(
  entityName: SyncEntityName,
  userId: string,
  data: Record<string, unknown>
): SyncableRecord {
  const base = {
    ...data,
    // Ownership comes from the path the document was read from, never from a
    // field. Everything under users/<uid> is that user's by definition, and a
    // record written without the field — or with a stale one — must not end up
    // invisible to the account it belongs to, since reads are scoped by owner.
    userId,
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
 * Pulls every record the account has for one entity.
 *
 * The pull deliberately fetches the whole collection instead of asking Firestore
 * for "everything newer than the last cursor". A `where`/`orderBy` on `updatedAt`
 * silently drops any document that lacks the field or stores it as a different
 * type (a Timestamp rather than an ISO string, say) — those documents are plainly
 * visible in the Firestore console yet unreachable by the query, which is exactly
 * how a tester's transactions went missing. Which records to keep is decided
 * locally instead, where a missing or oddly typed timestamp can be handled
 * rather than silently excluded.
 *
 * Ledgers are small (a beta tester's is hundreds of documents), so the cost of
 * reading them in full is worth never hiding a record again.
 */
async function pullTable(entityName: SyncEntityName, userId: string): Promise<PullOutcome> {
  const db = assertFirestore();
  const snapshot = await getDocs(collection(db, "users", userId, entityName));
  const table = getSyncTable(entityName);

  let applied = 0;
  let skipped = 0;
  let latestUpdatedAt: string | null = null;

  for (const document of snapshot.docs) {
    const data = document.data() as Record<string, unknown>;

    // A document whose id lives only on the document itself, not in its fields,
    // still has to land under a primary key locally.
    if (typeof data.id !== "string" || !data.id) {
      data.id = document.id;
    }

    const remoteRecord = fromRemoteDoc(entityName, userId, data);
    const localRecord = (await table.get(remoteRecord.id)) as SyncableRecord | undefined;

    if (shouldApplyRemoteRecord(remoteRecord.updatedAt, localRecord?.updatedAt)) {
      await table.put(remoteRecord as never);
      applied += 1;
    } else {
      skipped += 1;
    }

    if (!latestUpdatedAt || remoteRecord.updatedAt > latestUpdatedAt) {
      latestUpdatedAt = remoteRecord.updatedAt;
    }
  }

  if (latestUpdatedAt) {
    // Kept for support and diagnostics only — nothing filters on it any more.
    setCheckpoint(entityName, userId, latestUpdatedAt);
  }

  return { entityName, fetched: snapshot.size, applied, skipped };
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

    const outcomes = await Promise.all(
      SYNC_ENTITY_NAMES.map((entityName) => pullTable(entityName, userId))
    );

    return { ...(await syncRepository.summarize()), pulled: true, outcomes };
  }
};

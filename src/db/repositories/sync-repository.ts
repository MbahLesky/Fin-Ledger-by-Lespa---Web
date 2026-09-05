import { appDb } from "@/db/dexie";
import type { SyncEntityName, SyncOperationRecord, SyncOperationType, SyncSummary } from "@/types";
import { createId } from "@/utils/id";
import { nowIso } from "@/utils/date-utils";

export const syncRepository = {
  async enqueue(
    entityName: SyncEntityName,
    entityId: string,
    operation: SyncOperationType,
    payload?: string
  ) {
    const existing = await appDb.syncOperations
      .where("[entityName+entityId]")
      .equals([entityName, entityId] as never)
      .first();

    const timestamp = nowIso();

    if (existing) {
      await appDb.syncOperations.update(existing.id, {
        operation,
        payload: payload ?? existing.payload ?? null,
        errorMessage: null,
        retryCount: existing.retryCount,
        status: "pending",
        updatedAt: timestamp
      });
      return existing.id;
    }

    const record: SyncOperationRecord = {
      id: createId("sync"),
      entityName,
      entityId,
      operation,
      status: "pending",
      payload: payload ?? null,
      errorMessage: null,
      retryCount: 0,
      lastAttemptedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await appDb.syncOperations.add(record);
    return record.id;
  },

  async listPending(limit = 50) {
    return appDb.syncOperations.where("status").anyOf(["pending", "failed"]).limit(limit).toArray();
  },

  async markProcessing(id: string) {
    await appDb.syncOperations.update(id, {
      status: "processing",
      lastAttemptedAt: nowIso(),
      updatedAt: nowIso()
    });
  },

  async markFailed(id: string, errorMessage: string) {
    const record = await appDb.syncOperations.get(id);
    if (!record) {
      return;
    }

    await appDb.syncOperations.update(id, {
      status: "failed",
      errorMessage,
      retryCount: record.retryCount + 1,
      updatedAt: nowIso()
    });
  },

  async remove(id: string) {
    await appDb.syncOperations.delete(id);
  },

  async summarize(): Promise<SyncSummary> {
    const [pending, failed] = await Promise.all([
      appDb.syncOperations.where("status").equals("pending").count(),
      appDb.syncOperations.where("status").equals("failed").count()
    ]);

    const latestCompleted = await appDb.syncOperations.orderBy("updatedAt").last();

    return {
      pending,
      failed,
      processing: false,
      lastSyncedAt: latestCompleted?.updatedAt ?? null
    };
  },

  // Everything still owed to the cloud: queued, retrying, and mid-flight. Used to
  // warn before an action that would leave those changes stranded on this device.
  async countUnsynced() {
    return appDb.syncOperations
      .where("status")
      .anyOf(["pending", "failed", "processing"])
      .count();
  },

  async clearAll() {
    await appDb.syncOperations.clear();
  }
};


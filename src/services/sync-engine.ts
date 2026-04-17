/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { appDb, getOptionalTable } from "@/db/dexie";
import { syncRepository } from "@/db/repositories/sync-repository";
import { supabase } from "@/lib/supabase-client";
import type {
  Account,
  AppSettings,
  Category,
  NotificationPreference,
  SyncEntityName,
  SyncOperationRecord,
  TransferRecord,
  TransactionRecord
} from "@/types";
import { nowIso } from "@/utils/date-utils";

const CHECKPOINT_PREFIX = "finance-ledger-checkpoint";

function assertSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
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

function getRemoteTableName(entityName: SyncEntityName) {
  if (entityName === "notificationPreferences") {
    return "notification_preferences";
  }

  return entityName;
}

function toRemoteRow(
  record:
    | Account
    | Category
    | TransactionRecord
    | TransferRecord
    | AppSettings
    | NotificationPreference
) {
  if ("initialBalance" in record) {
    return {
      id: record.id,
      user_id: record.userId,
      name: record.name,
      type: record.type,
      initial_balance: record.initialBalance,
      currency_code: record.currencyCode,
      is_default: record.isDefault,
      is_archived: record.isArchived,
      display_order: record.displayOrder,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      deleted_at: record.deletedAt
    };
  }

  if ("isSystem" in record) {
    return {
      id: record.id,
      user_id: record.userId,
      name: record.name,
      type: record.type,
      icon_key: record.iconKey,
      color_key: record.colorKey,
      is_system: record.isSystem,
      is_active: record.isActive,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      deleted_at: record.deletedAt
    };
  }

  if ("transactionDate" in record) {
    return {
      id: record.id,
      user_id: record.userId,
      account_id: record.accountId,
      category_id: record.categoryId,
      type: record.type,
      amount: record.amount,
      note: record.note,
      transaction_date: record.transactionDate,
      reference: record.reference,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      deleted_at: record.deletedAt
    };
  }

  if ("transferDate" in record) {
    return {
      id: record.id,
      user_id: record.userId,
      from_account_id: record.fromAccountId,
      to_account_id: record.toAccountId,
      amount: record.amount,
      fee: record.fee,
      note: record.note,
      transfer_date: record.transferDate,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      deleted_at: record.deletedAt
    };
  }

  if ("onboardingComplete" in record) {
    return {
      id: record.id,
      user_id: record.userId,
      currency_code: record.currencyCode,
      theme_mode: record.themeMode,
      onboarding_complete: record.onboardingComplete,
      created_at: record.createdAt,
      updated_at: record.updatedAt
    };
  }

  return {
    id: record.id,
    user_id: record.userId,
    enabled: record.enabled,
    reminder_time: record.reminderTime,
    timing_mode: record.timingMode,
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}

function fromRemoteRow(
  entityName: SyncEntityName,
  row: Record<string, unknown>
): Account | Category | TransactionRecord | TransferRecord | AppSettings | NotificationPreference {
  if (entityName === "accounts") {
    return {
      id: String(row.id),
      remoteId: String(row.id),
      userId: String(row.user_id),
      name: String(row.name),
      type: row.type as Account["type"],
      initialBalance: Number(row.initial_balance),
      currencyCode: String(row.currency_code),
      isDefault: Boolean(row.is_default),
      isArchived: Boolean(row.is_archived),
      displayOrder: Number(row.display_order),
      syncStatus: "synced",
      syncError: null,
      lastSyncedAt: nowIso(),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      deletedAt: (row.deleted_at as string | null | undefined) ?? null
    };
  }

  if (entityName === "categories") {
    return {
      id: String(row.id),
      remoteId: String(row.id),
      userId: String(row.user_id),
      name: String(row.name),
      type: row.type as Category["type"],
      iconKey: (row.icon_key as string | null | undefined) ?? null,
      colorKey: (row.color_key as string | null | undefined) ?? null,
      isSystem: Boolean(row.is_system),
      isActive: Boolean(row.is_active),
      syncStatus: "synced",
      syncError: null,
      lastSyncedAt: nowIso(),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      deletedAt: (row.deleted_at as string | null | undefined) ?? null
    };
  }

  if (entityName === "transactions") {
    return {
      id: String(row.id),
      remoteId: String(row.id),
      userId: String(row.user_id),
      accountId: String(row.account_id),
      categoryId: String(row.category_id),
      type: row.type as TransactionRecord["type"],
      amount: Number(row.amount),
      note: String(row.note ?? ""),
      transactionDate: String(row.transaction_date),
      reference: (row.reference as string | null | undefined) ?? null,
      syncStatus: "synced",
      syncError: null,
      lastSyncedAt: nowIso(),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      deletedAt: (row.deleted_at as string | null | undefined) ?? null
    };
  }

  if (entityName === "transfers") {
    return {
      id: String(row.id),
      remoteId: String(row.id),
      userId: String(row.user_id),
      fromAccountId: String(row.from_account_id),
      toAccountId: String(row.to_account_id),
      amount: Number(row.amount),
      fee: Number(row.fee ?? 0),
      note: String(row.note ?? ""),
      transferDate: String(row.transfer_date),
      syncStatus: "synced",
      syncError: null,
      lastSyncedAt: nowIso(),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      deletedAt: (row.deleted_at as string | null | undefined) ?? null
    };
  }

  if (entityName === "settings") {
    return {
      id: String(row.id),
      remoteId: String(row.id),
      userId: String(row.user_id),
      currencyCode: String(row.currency_code),
      themeMode: row.theme_mode as AppSettings["themeMode"],
      onboardingComplete: Boolean(row.onboarding_complete),
      syncStatus: "synced",
      syncError: null,
      lastSyncedAt: nowIso(),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    };
  }

  return {
    id: String(row.id),
    remoteId: String(row.id),
    userId: String(row.user_id),
    enabled: Boolean(row.enabled),
    reminderTime: (row.reminder_time as string | null | undefined) ?? null,
    timingMode: "daily",
    syncStatus: "synced",
    syncError: null,
    lastSyncedAt: nowIso(),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

async function markLocalSynced(
  entityName: SyncEntityName,
  entityId: string,
  maybeRemoteId?: string
) {
  const table = getSyncTable(entityName) as any;
  const record = await table.get(entityId);
  if (!record) {
    return;
  }

  await table.put({
    ...record,
    remoteId: maybeRemoteId ?? record.remoteId ?? entityId,
    syncStatus: "synced",
    syncError: null,
    lastSyncedAt: nowIso()
  });
}

async function markLocalFailed(entityName: SyncEntityName, entityId: string, errorMessage: string) {
  const table = getSyncTable(entityName) as any;
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

async function pushOperation(operation: SyncOperationRecord) {
  const client = assertSupabase();
  const table = getSyncTable(operation.entityName);
  const record = await table.get(operation.entityId);

  if (!record) {
    await syncRepository.remove(operation.id);
    return;
  }

  if (!record.userId) {
    throw new Error("Local record is missing authenticated ownership.");
  }

  await syncRepository.markProcessing(operation.id);

  const remoteRow = toRemoteRow(record);
  const { error } = await client
    .from(getRemoteTableName(operation.entityName))
    .upsert(remoteRow, { onConflict: "user_id,id" });

  if (error) {
    await markLocalFailed(operation.entityName, operation.entityId, error.message);
    await syncRepository.markFailed(operation.id, error.message);
    throw new Error(error.message);
  }

  await markLocalSynced(operation.entityName, operation.entityId, String(remoteRow.id));
  await syncRepository.remove(operation.id);
}

async function pullTable(entityName: SyncEntityName, userId: string) {
  const client = assertSupabase();
  const checkpoint = getCheckpoint(entityName);
  let query = client
    .from(getRemoteTableName(entityName))
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: true });

  if (checkpoint) {
    query = query.gt("updated_at", checkpoint);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const table = getSyncTable(entityName);

  for (const row of rows) {
    const remoteRecord = fromRemoteRow(entityName, row);
    const localRecord = await table.get(remoteRecord.id);

    if (!localRecord || remoteRecord.updatedAt >= localRecord.updatedAt) {
      await table.put(remoteRecord as never);
    }
  }

  const latest = rows.at(-1) as Record<string, unknown> | undefined;
  if (latest?.updated_at) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    setCheckpoint(entityName, String(latest.updated_at));
  }
}

export const syncEngine = {
  async run(userId: string) {
    if (!navigator.onLine || !supabase) {
      return syncRepository.summarize();
    }

    const pendingOperations = await syncRepository.listPending();

    for (const operation of pendingOperations) {
      try {
        await pushOperation(operation);
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

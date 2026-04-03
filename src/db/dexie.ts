import Dexie, { type Table } from "dexie";
import type {
  Account,
  AppSettings,
  Category,
  ExportRecord,
  ImportRecord,
  NotificationPreference,
  SyncOperationRecord,
  TransactionRecord
} from "@/types";

export class FinanceLedgerDatabase extends Dexie {
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  transactions!: Table<TransactionRecord, string>;
  settings!: Table<AppSettings, string>;
  notificationPreferences!: Table<NotificationPreference, string>;
  importRecords!: Table<ImportRecord, string>;
  exportRecords!: Table<ExportRecord, string>;
  syncOperations!: Table<SyncOperationRecord, string>;

  constructor() {
    super("finance-ledger-web");

    this.version(1).stores({
      accounts: "id, userId, name, type, syncStatus, updatedAt, deletedAt, displayOrder",
      categories: "id, userId, [type+name], syncStatus, updatedAt, deletedAt, isActive",
      transactions:
        "id, userId, accountId, categoryId, transactionDate, type, syncStatus, updatedAt, deletedAt",
      settings: "id, userId, updatedAt, onboardingComplete",
      notificationPreferences: "id, userId, updatedAt, enabled",
      importRecords: "id, createdAt, status",
      exportRecords: "id, createdAt",
      syncOperations: "id, entityName, entityId, [entityName+entityId], status, updatedAt, createdAt"
    });
  }
}

export const appDb = new FinanceLedgerDatabase();

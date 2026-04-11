import Dexie, { type IndexableType, type Table } from "dexie";
import type {
  Account,
  AppSettings,
  Category,
  ExportRecord,
  ImportRecord,
  NotificationPreference,
  SyncOperationRecord,
  TransferRecord,
  TransactionRecord
} from "@/types";

export class FinanceLedgerDatabase extends Dexie {
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  transactions!: Table<TransactionRecord, string>;
  transfers!: Table<TransferRecord, string>;
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

    this.version(2).stores({
      accounts: "id, userId, name, type, syncStatus, updatedAt, deletedAt, displayOrder",
      categories: "id, userId, [type+name], syncStatus, updatedAt, deletedAt, isActive",
      transactions:
        "id, userId, accountId, categoryId, transactionDate, type, syncStatus, updatedAt, deletedAt",
      transfers:
        "id, userId, fromAccountId, toAccountId, transferDate, syncStatus, updatedAt, deletedAt",
      settings: "id, userId, updatedAt, onboardingComplete",
      notificationPreferences: "id, userId, updatedAt, enabled",
      importRecords: "id, createdAt, status",
      exportRecords: "id, createdAt",
      syncOperations: "id, entityName, entityId, [entityName+entityId], status, updatedAt, createdAt"
    });

    this.accounts = this.table("accounts");
    this.categories = this.table("categories");
    this.transactions = this.table("transactions");
    this.transfers = this.table("transfers");
    this.settings = this.table("settings");
    this.notificationPreferences = this.table("notificationPreferences");
    this.importRecords = this.table("importRecords");
    this.exportRecords = this.table("exportRecords");
    this.syncOperations = this.table("syncOperations");
  }
}

export const appDb = new FinanceLedgerDatabase();

export function getOptionalTable<RecordType, KeyType extends IndexableType = string>(
  tableName: string
) {
  const table = appDb.tables.find((candidate) => candidate.name === tableName);
  return (table as Table<RecordType, KeyType> | undefined) ?? null;
}

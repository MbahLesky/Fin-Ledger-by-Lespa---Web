import type { ExportRecord, ImportRecord } from "@/types";

const IMPORT_HISTORY_KEY = "finance-ledger-web.import-history";
const EXPORT_HISTORY_KEY = "finance-ledger-web.export-history";

function readLocalRows<T>(key: string): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocalRows<T>(key: string, rows: T[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(rows));
}

export const auditRepository = {
  listImports() {
    return Promise.resolve(
      readLocalRows<ImportRecord>(IMPORT_HISTORY_KEY).sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt)
      )
    );
  },

  listExports() {
    return Promise.resolve(
      readLocalRows<ExportRecord>(EXPORT_HISTORY_KEY).sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt)
      )
    );
  },

  async addImportRecord(record: ImportRecord) {
    const rows = await this.listImports();
    writeLocalRows(IMPORT_HISTORY_KEY, [record, ...rows].slice(0, 25));
  },

  async addExportRecord(record: ExportRecord) {
    const rows = await this.listExports();
    writeLocalRows(EXPORT_HISTORY_KEY, [record, ...rows].slice(0, 25));
  },

  clearHistory() {
    if (typeof window === "undefined") {
      return Promise.resolve();
    }

    window.localStorage.removeItem(IMPORT_HISTORY_KEY);
    window.localStorage.removeItem(EXPORT_HISTORY_KEY);
    return Promise.resolve();
  }
};

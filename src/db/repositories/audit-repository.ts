import { appDb } from "@/db/dexie";
import type { ExportRecord, ImportRecord } from "@/types";

export const auditRepository = {
  async listImports() {
    return appDb.importRecords.orderBy("createdAt").reverse().toArray();
  },

  async listExports() {
    return appDb.exportRecords.orderBy("createdAt").reverse().toArray();
  },

  async addImportRecord(record: ImportRecord) {
    await appDb.importRecords.add(record);
  },

  async addExportRecord(record: ExportRecord) {
    await appDb.exportRecords.add(record);
  },

  async clearHistory() {
    await Promise.all([appDb.importRecords.clear(), appDb.exportRecords.clear()]);
  }
};


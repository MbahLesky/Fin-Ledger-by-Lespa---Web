import { appDb, getOptionalTable } from "@/db/dexie";
import { accountsRepository } from "@/db/repositories/accounts-repository";
import { categoriesRepository } from "@/db/repositories/categories-repository";
import { settingsRepository } from "@/db/repositories/settings-repository";
import { syncRepository } from "@/db/repositories/sync-repository";
import { transfersRepository } from "@/db/repositories/transfers-repository";
import { transactionsRepository } from "@/db/repositories/transactions-repository";

export const workspaceRepository = {
  async initialize() {
    await settingsRepository.ensureSeedData();
    await accountsRepository.listActive();
    await categoriesRepository.listActive();
  },

  async stampOwnership(userId: string) {
    await Promise.all([
      accountsRepository.stampOwnership(userId),
      categoriesRepository.stampOwnership(userId),
      transactionsRepository.stampOwnership(userId),
      transfersRepository.stampOwnership(userId),
      settingsRepository.updateSettings({ userId }),
      settingsRepository.updateNotificationPreferences({ userId })
    ]);
  },

  async resetAppData() {
    const transfersTable = getOptionalTable("transfers");
    await Promise.all([
      appDb.accounts.clear(),
      appDb.categories.clear(),
      appDb.transactions.clear(),
      transfersTable ? transfersTable.clear() : Promise.resolve(),
      appDb.settings.clear(),
      appDb.notificationPreferences.clear(),
      appDb.importRecords.clear(),
      appDb.exportRecords.clear(),
      syncRepository.clearAll()
    ]);

    await this.initialize();
  }
};

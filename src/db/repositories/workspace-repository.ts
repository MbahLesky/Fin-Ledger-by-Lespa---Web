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

  // Call before the sync pull. If settings/notification-preference rows
  // currently belong to a different account (this browser was last used by
  // someone else), reset them so the pull can't inherit that account's
  // onboarding/preference state, nor have a foreign-but-fresher timestamp block
  // this user's real history from loading.
  async releaseStaleOwnership(userId: string) {
    const [settings, notificationPreferences] = await Promise.all([
      settingsRepository.getSettings(),
      settingsRepository.getNotificationPreferences()
    ]);

    await Promise.all([
      settings.userId && settings.userId !== userId
        ? settingsRepository.resetSettingsOwnership()
        : Promise.resolve(),
      notificationPreferences.userId && notificationPreferences.userId !== userId
        ? settingsRepository.resetNotificationPreferencesOwnership()
        : Promise.resolve()
    ]);
  },

  // Call after the sync pull. For a returning user this is a no-op — the pull
  // already restored their real data, `userId` included — so only a genuinely
  // unclaimed local row (a new account, or one just reset above) gets stamped
  // and queued for push.
  async stampOwnership(userId: string) {
    const [settings, notificationPreferences] = await Promise.all([
      settingsRepository.getSettings(),
      settingsRepository.getNotificationPreferences()
    ]);

    await Promise.all([
      accountsRepository.stampOwnership(userId),
      categoriesRepository.stampOwnership(userId),
      transactionsRepository.stampOwnership(userId),
      transfersRepository.stampOwnership(userId),
      settings.userId === userId ? Promise.resolve() : settingsRepository.updateSettings({ userId }),
      notificationPreferences.userId === userId
        ? Promise.resolve()
        : settingsRepository.updateNotificationPreferences({ userId })
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

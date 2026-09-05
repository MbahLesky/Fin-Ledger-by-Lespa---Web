import { appDb, getOptionalTable } from "@/db/dexie";
import { hasEvidenceOfExistingLedger } from "@/db/onboarding-evidence";
import { repairSeededPlaceholders } from "@/db/repairs/placeholder-repair";
import { accountsRepository } from "@/db/repositories/accounts-repository";
import { categoriesRepository } from "@/db/repositories/categories-repository";
import { settingsRepository } from "@/db/repositories/settings-repository";
import { syncRepository } from "@/db/repositories/sync-repository";
import { transfersRepository } from "@/db/repositories/transfers-repository";
import { transactionsRepository } from "@/db/repositories/transactions-repository";
import { clearCheckpoints } from "@/services/sync-checkpoints";
import type { TransferRecord } from "@/types";

export const workspaceRepository = {
  async initialize() {
    await settingsRepository.ensureSeedData();
    await accountsRepository.listActive();
    await categoriesRepository.listActive();

    // Runs before the first pull of the session, so a device already holding
    // "now"-dated placeholders can still receive its account's real records.
    await repairSeededPlaceholders();
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
  //
  // Only ever call this once the pull has actually succeeded: stamping bumps
  // `updatedAt` to now and queues a push, so doing it after a failed pull would
  // upload the seeded placeholders (zero balances, onboarding not complete) over
  // the account's real remote records.
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

  /**
   * Onboarding is a one-time step per account, but the flag that records it lives
   * on the local settings row — so an account whose settings document never
   * reached Firestore (it predates settings sync, or its push failed) was sent
   * back through onboarding on every fresh sign-in, and offered "start fresh or
   * import" over a ledger it already had.
   *
   * Existing ledger data is the reliable proof that onboarding happened, so once
   * a pull has brought that data down, trust it over the flag. Seeded defaults
   * prove nothing: only records the user actually created or changed count.
   *
   * Call after a successful pull only.
   */
  async reconcileOnboardingState() {
    const settings = await settingsRepository.getSettings();
    if (settings.onboardingComplete) {
      return false;
    }

    const transfersTable = getOptionalTable<TransferRecord>("transfers");
    const [transactionCount, transferCount, accounts, categories] = await Promise.all([
      appDb.transactions.count(),
      transfersTable ? transfersTable.count() : Promise.resolve(0),
      appDb.accounts.toArray(),
      appDb.categories.toArray()
    ]);

    if (!hasEvidenceOfExistingLedger({ transactionCount, transferCount, accounts, categories })) {
      return false;
    }

    await settingsRepository.setOnboardingComplete(true);
    return true;
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

    // The pull cursors describe rows that no longer exist. Left in place they
    // would tell the next pull that everything before "now" is already present,
    // and the account's remote history would never come back down.
    clearCheckpoints();

    await this.initialize();
  }
};

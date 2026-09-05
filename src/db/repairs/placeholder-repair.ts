import { appDb, getOptionalTable } from "@/db/dexie";
import { NEVER_SYNCED } from "@/db/seed/default-records";
import { clearCheckpoints } from "@/services/sync-checkpoints";
import type { Account, AppSettings, Category, NotificationPreference } from "@/types";

const REPAIR_FLAG_KEY = "monilog:placeholder-repair:v1";

/**
 * A row that is still exactly what the app seeded — the user has never given it a
 * value. Only these are safe to re-date: nothing the user entered is touched.
 */
function isUntouchedAccount(account: Account) {
  return account.isDefault && account.openingBalance === 0 && !account.deletedAt;
}

function isUntouchedCategory(category: Category) {
  return category.isDefault && !category.deletedAt;
}

function isUntouchedSettings(settings: AppSettings) {
  return !settings.onboardingComplete && settings.tutorialCompletedIds.length === 0;
}

function isUntouchedNotificationPreferences(preferences: NotificationPreference) {
  return !preferences.enabled;
}

function hasRun() {
  try {
    return window.localStorage.getItem(REPAIR_FLAG_KEY) === "done";
  } catch {
    return false;
  }
}

function markRun() {
  try {
    window.localStorage.setItem(REPAIR_FLAG_KEY, "done");
  } catch {
    // Without the flag the repair simply runs again next launch; it is idempotent.
  }
}

/**
 * One-time repair for installs created before seeded rows were dated
 * `NEVER_SYNCED`.
 *
 * Those installs seeded their placeholder accounts, categories and settings with
 * `updatedAt` set to "now". Last-write-wins then made the placeholders outrank the
 * account's real, older remote records, so a pull could never replace them: the
 * ledger showed zero balances and onboarding ran again on a device that had
 * already been through it. Worse, the pull still advanced its cursor past those
 * skipped records, so the data could never arrive on a later attempt either.
 *
 * Re-dating the untouched placeholders and dropping the cursors puts such a
 * device back where a clean install would be — one full pull away from the
 * account's real data. Rows are written directly, without queueing a sync
 * operation: the timestamps are a local merge hint, not a change to upload.
 */
export async function repairSeededPlaceholders(): Promise<boolean> {
  if (typeof window === "undefined" || hasRun()) {
    return false;
  }

  const transfersTable = getOptionalTable("transfers");
  const [accounts, categories, settings, notificationPreferences] = await Promise.all([
    appDb.accounts.toArray(),
    appDb.categories.toArray(),
    appDb.settings.toArray(),
    appDb.notificationPreferences.toArray()
  ]);

  await Promise.all([
    ...accounts
      .filter(isUntouchedAccount)
      .map((account) => appDb.accounts.put({ ...account, updatedAt: NEVER_SYNCED })),
    ...categories
      .filter(isUntouchedCategory)
      .map((category) => appDb.categories.put({ ...category, updatedAt: NEVER_SYNCED })),
    ...settings
      .filter(isUntouchedSettings)
      .map((row) => appDb.settings.put({ ...row, updatedAt: NEVER_SYNCED })),
    ...notificationPreferences
      .filter(isUntouchedNotificationPreferences)
      .map((row) => appDb.notificationPreferences.put({ ...row, updatedAt: NEVER_SYNCED }))
  ]);

  // Transfers are never seeded, so nothing there needs re-dating — the cursor
  // reset below is what brings any missing ones down.
  void transfersTable;

  clearCheckpoints();
  markRun();
  return true;
}

export const PLACEHOLDER_REPAIR_FLAG_KEY = REPAIR_FLAG_KEY;
export const placeholderRepairPredicates = {
  isUntouchedAccount,
  isUntouchedCategory,
  isUntouchedSettings,
  isUntouchedNotificationPreferences
};

import {
  DEFAULT_ACCOUNTS,
  DEFAULT_CATEGORY_SEEDS,
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  NOTIFICATION_PREFERENCES_ID,
  SETTINGS_ROW_ID
} from "@/lib/constants";
import type { Account, AppSettings, Category, NotificationPreference } from "@/types";
import { nowIso } from "@/utils/date-utils";

// Every seeded placeholder row must always lose a last-write-wins comparison
// against a genuine remote record — otherwise a device syncing for the first
// time (or after local storage was reset/reassigned to another account) seeds
// `updatedAt` to "now", which outranks the real, older remote history and blocks
// it from ever being pulled down. The default accounts and categories share
// fixed ids with the remote (and Flutter) records, so a "now" stamp on them hid
// a returning user's real opening balances behind zeroed placeholders; settings
// carrying one re-triggered onboarding for a user who had already finished it.
export const NEVER_SYNCED = new Date(0).toISOString();

export function createDefaultSettings(): AppSettings {
  const timestamp = nowIso();

  return {
    id: SETTINGS_ROW_ID,
    currencyCode: DEFAULT_CURRENCY,
    language: DEFAULT_LANGUAGE,
    themeMode: "system",
    onboardingComplete: false,
    tutorialCompletedIds: [],
    userId: null,
    remoteId: null,
    syncStatus: "pending",
    syncError: null,
    lastSyncedAt: null,
    createdAt: timestamp,
    updatedAt: NEVER_SYNCED
  };
}

export function createDefaultNotificationPreferences(): NotificationPreference {
  const timestamp = nowIso();

  return {
    id: NOTIFICATION_PREFERENCES_ID,
    enabled: false,
    reminderTime: "20:00",
    timingMode: "daily",
    userId: null,
    remoteId: null,
    syncStatus: "pending",
    syncError: null,
    lastSyncedAt: null,
    createdAt: timestamp,
    updatedAt: NEVER_SYNCED
  };
}

export function createDefaultAccounts(): Account[] {
  const timestamp = nowIso();

  return DEFAULT_ACCOUNTS.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    openingBalance: 0,
    isDefault: true,
    displayOrder: account.displayOrder,
    userId: null,
    remoteId: null,
    syncStatus: "pending",
    syncError: null,
    lastSyncedAt: null,
    createdAt: timestamp,
    updatedAt: NEVER_SYNCED,
    deletedAt: null
  }));
}

export function createDefaultCategories(): Category[] {
  const timestamp = nowIso();

  return DEFAULT_CATEGORY_SEEDS.map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
    iconKey: category.iconKey,
    colorKey: category.colorKey,
    isDefault: true,
    userId: null,
    remoteId: null,
    syncStatus: "pending",
    syncError: null,
    lastSyncedAt: null,
    createdAt: timestamp,
    updatedAt: NEVER_SYNCED,
    deletedAt: null
  }));
}

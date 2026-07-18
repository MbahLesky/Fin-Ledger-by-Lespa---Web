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
    updatedAt: timestamp
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
    updatedAt: timestamp
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
    updatedAt: timestamp,
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
    updatedAt: timestamp,
    deletedAt: null
  }));
}

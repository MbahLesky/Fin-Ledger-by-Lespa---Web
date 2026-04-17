import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORY_SEEDS, DEFAULT_CURRENCY } from "@/lib/constants";
import type { Account, AppSettings, Category, NotificationPreference } from "@/types";
import { nowIso } from "@/utils/date-utils";
import { createUuid } from "@/utils/id";

export function createDefaultSettings(userId: string): AppSettings {
  const timestamp = nowIso();

  return {
    id: createUuid(),
    currencyCode: DEFAULT_CURRENCY,
    themeMode: "system",
    onboardingComplete: false,
    userId,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createDefaultNotificationPreferences(userId: string): NotificationPreference {
  const timestamp = nowIso();

  return {
    id: createUuid(),
    enabled: false,
    reminderTime: "20:00",
    timingMode: "daily",
    userId,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createDefaultAccounts(userId: string, currencyCode = DEFAULT_CURRENCY): Account[] {
  const timestamp = nowIso();

  return DEFAULT_ACCOUNTS.map((account) => ({
    id: createUuid(),
    name: account.name,
    type: account.type,
    initialBalance: 0,
    currencyCode,
    isDefault: true,
    isArchived: false,
    displayOrder: account.displayOrder,
    userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null
  }));
}

export function createDefaultCategories(userId: string): Category[] {
  const timestamp = nowIso();

  return DEFAULT_CATEGORY_SEEDS.map((category) => ({
    id: createUuid(),
    name: category.name,
    type: category.type,
    iconKey: category.iconKey,
    colorKey: category.colorKey,
    isSystem: false,
    isActive: true,
    userId,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null
  }));
}

import { describe, expect, it } from "vitest";
import { placeholderRepairPredicates } from "@/db/repairs/placeholder-repair";
import {
  createDefaultAccounts,
  createDefaultCategories,
  createDefaultNotificationPreferences,
  createDefaultSettings
} from "@/db/seed/default-records";

const {
  isUntouchedAccount,
  isUntouchedCategory,
  isUntouchedSettings,
  isUntouchedNotificationPreferences
} = placeholderRepairPredicates;

describe("placeholder repair predicates", () => {
  it("treats a seeded account as untouched", () => {
    const [account] = createDefaultAccounts();

    expect(isUntouchedAccount(account)).toBe(true);
  });

  it("leaves an account the user gave a balance alone", () => {
    const [account] = createDefaultAccounts();

    expect(isUntouchedAccount({ ...account, openingBalance: 40_000 })).toBe(false);
  });

  it("leaves an account the user created alone", () => {
    const [account] = createDefaultAccounts();

    expect(isUntouchedAccount({ ...account, isDefault: false })).toBe(false);
  });

  it("treats a seeded category as untouched and a user category as not", () => {
    const [category] = createDefaultCategories();

    expect(isUntouchedCategory(category)).toBe(true);
    expect(isUntouchedCategory({ ...category, isDefault: false })).toBe(false);
  });

  it("leaves settings alone once onboarding is complete", () => {
    const settings = createDefaultSettings();

    expect(isUntouchedSettings(settings)).toBe(true);
    expect(isUntouchedSettings({ ...settings, onboardingComplete: true })).toBe(false);
  });

  it("leaves settings alone once a tutorial has been finished", () => {
    const settings = createDefaultSettings();

    expect(isUntouchedSettings({ ...settings, tutorialCompletedIds: ["dashboard"] })).toBe(false);
  });

  it("leaves notification preferences alone once reminders are on", () => {
    const preferences = createDefaultNotificationPreferences();

    expect(isUntouchedNotificationPreferences(preferences)).toBe(true);
    expect(isUntouchedNotificationPreferences({ ...preferences, enabled: true })).toBe(false);
  });
});

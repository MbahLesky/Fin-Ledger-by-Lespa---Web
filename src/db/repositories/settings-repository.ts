import { appDb } from "@/db/dexie";
import { createDefaultNotificationPreferences, createDefaultSettings } from "@/db/seed/default-records";
import { SETTINGS_ROW_ID } from "@/lib/constants";
import type { AppSettings, NotificationPreference, ThemeMode } from "@/types";
import { nowIso } from "@/utils/date-utils";
import { syncRepository } from "@/db/repositories/sync-repository";

export const settingsRepository = {
  async ensureSeedData() {
    const [settings, notificationPreferences] = await Promise.all([
      appDb.settings.get(SETTINGS_ROW_ID),
      appDb.notificationPreferences.toCollection().first()
    ]);

    await appDb.transaction("rw", appDb.settings, appDb.notificationPreferences, async () => {
      if (!settings) {
        await appDb.settings.put(createDefaultSettings());
      }

      if (!notificationPreferences) {
        await appDb.notificationPreferences.put(createDefaultNotificationPreferences());
      }
    });
  },

  async getSettings() {
    const settings = await appDb.settings.get(SETTINGS_ROW_ID);
    return settings ?? createDefaultSettings();
  },

  async updateSettings(updates: Partial<Pick<AppSettings, "currencyCode" | "themeMode" | "onboardingComplete" | "userId">>) {
    const current = await this.getSettings();

    const next: AppSettings = {
      ...current,
      ...updates,
      syncStatus: "pending",
      syncError: null,
      updatedAt: nowIso()
    };

    await appDb.settings.put(next);
    await syncRepository.enqueue("settings", next.id, "update", JSON.stringify(next));
    return next;
  },

  async setThemeMode(themeMode: ThemeMode) {
    return this.updateSettings({ themeMode });
  },

  async setCurrency(currencyCode: string) {
    return this.updateSettings({ currencyCode });
  },

  async setOnboardingComplete(onboardingComplete: boolean) {
    return this.updateSettings({ onboardingComplete });
  },

  async getNotificationPreferences(): Promise<NotificationPreference> {
    const preferences = await appDb.notificationPreferences.toCollection().first();
    return preferences ?? createDefaultNotificationPreferences();
  },

  async updateNotificationPreferences(
    updates: Partial<Pick<NotificationPreference, "enabled" | "reminderTime" | "timingMode" | "userId">>
  ) {
    const current = await this.getNotificationPreferences();

    const next: NotificationPreference = {
      ...current,
      ...updates,
      syncStatus: "pending",
      syncError: null,
      updatedAt: nowIso()
    };

    await appDb.notificationPreferences.put(next);
    await syncRepository.enqueue("notificationPreferences", next.id, "update", JSON.stringify(next));
    return next;
  }
};

import { createDefaultNotificationPreferences, createDefaultSettings } from "@/db/seed/default-records";
import {
  assertOnlineForSharedWrite,
  assertSupabaseClient,
  getAuthenticatedUserId,
  getOptionalAuthenticatedUserId,
  nowTimestamp,
  readBoolean,
  readNullableString,
  readString
} from "@/services/supabase-data-service";
import { useRealtimeStore } from "@/store/realtime-store";
import type { AppSettings, NotificationPreference, ThemeMode } from "@/types";

function fromSettingsRow(row: Record<string, unknown>): AppSettings {
  return {
    id: readString(row, "id"),
    userId: readString(row, "user_id"),
    currencyCode: readString(row, "currency_code", "USD"),
    themeMode: readString(row, "theme_mode", "system") as ThemeMode,
    onboardingComplete: readBoolean(row, "onboarding_complete"),
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at")
  };
}

function toSettingsPayload(settings: AppSettings) {
  return {
    id: settings.id,
    user_id: settings.userId,
    currency_code: settings.currencyCode,
    theme_mode: settings.themeMode,
    onboarding_complete: settings.onboardingComplete,
    created_at: settings.createdAt,
    updated_at: settings.updatedAt
  };
}

function toSettingsUpdatePayload(settings: AppSettings) {
  return {
    currency_code: settings.currencyCode,
    theme_mode: settings.themeMode,
    onboarding_complete: settings.onboardingComplete,
    updated_at: settings.updatedAt
  };
}

function fromNotificationRow(row: Record<string, unknown>): NotificationPreference {
  return {
    id: readString(row, "id"),
    userId: readString(row, "user_id"),
    enabled: readBoolean(row, "enabled"),
    reminderTime: readNullableString(row, "reminder_time"),
    timingMode: "daily",
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at")
  };
}

function toNotificationPayload(preferences: NotificationPreference) {
  return {
    id: preferences.id,
    user_id: preferences.userId,
    enabled: preferences.enabled,
    reminder_time: preferences.reminderTime ?? null,
    timing_mode: preferences.timingMode,
    created_at: preferences.createdAt,
    updated_at: preferences.updatedAt
  };
}

function toNotificationUpdatePayload(preferences: NotificationPreference) {
  return {
    enabled: preferences.enabled,
    reminder_time: preferences.reminderTime ?? null,
    timing_mode: preferences.timingMode,
    updated_at: preferences.updatedAt
  };
}

function notifySettingsChanged(tableName: "settings" | "notification_preferences") {
  useRealtimeStore.getState().markLocalMutation(tableName);
}

async function fetchSettings(userId: string) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = data?.[0];
  return row ? fromSettingsRow(row) : undefined;
}

async function fetchNotificationPreferences(userId: string) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = data?.[0];
  return row ? fromNotificationRow(row) : undefined;
}

async function createSettings(settings: AppSettings) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("settings")
    .insert(toSettingsPayload(settings))
    .select("*")
    .single();

  if (error) {
    const existing = await fetchSettings(settings.userId);
    if (existing) {
      return existing;
    }

    throw new Error(error.message);
  }

  notifySettingsChanged("settings");
  return fromSettingsRow(data);
}

async function updateSettingsRow(settings: AppSettings) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("settings")
    .update(toSettingsUpdatePayload(settings))
    .eq("user_id", settings.userId)
    .eq("id", settings.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return createSettings(settings);
  }

  notifySettingsChanged("settings");
  return fromSettingsRow(data);
}

async function createNotificationPreferences(preferences: NotificationPreference) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("notification_preferences")
    .insert(toNotificationPayload(preferences))
    .select("*")
    .single();

  if (error) {
    const existing = await fetchNotificationPreferences(preferences.userId);
    if (existing) {
      return existing;
    }

    throw new Error(error.message);
  }

  notifySettingsChanged("notification_preferences");
  return fromNotificationRow(data);
}

async function updateNotificationPreferencesRow(preferences: NotificationPreference) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("notification_preferences")
    .update(toNotificationUpdatePayload(preferences))
    .eq("user_id", preferences.userId)
    .eq("id", preferences.id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return createNotificationPreferences(preferences);
  }

  notifySettingsChanged("notification_preferences");
  return fromNotificationRow(data);
}

export const settingsRepository = {
  async ensureSeedData(userId?: string) {
    const ownerId = userId ?? (await getAuthenticatedUserId());
    const [settings, notificationPreferences] = await Promise.all([
      fetchSettings(ownerId),
      fetchNotificationPreferences(ownerId)
    ]);

    await Promise.all([
      settings ? Promise.resolve(settings) : createSettings(createDefaultSettings(ownerId)),
      notificationPreferences
        ? Promise.resolve(notificationPreferences)
        : createNotificationPreferences(createDefaultNotificationPreferences(ownerId))
    ]);
  },

  async getSettings() {
    const userId = await getOptionalAuthenticatedUserId();
    if (!userId) {
      return createDefaultSettings("signed-out");
    }

    const existing = await fetchSettings(userId);
    if (existing) {
      return existing;
    }

    return createSettings(createDefaultSettings(userId));
  },

  async updateSettings(updates: Partial<Pick<AppSettings, "currencyCode" | "themeMode" | "onboardingComplete" | "userId">>) {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const current = await this.getSettings();

    return updateSettingsRow({
      ...current,
      ...updates,
      userId,
      updatedAt: nowTimestamp()
    });
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
    const userId = await getOptionalAuthenticatedUserId();
    if (!userId) {
      return createDefaultNotificationPreferences("signed-out");
    }

    const existing = await fetchNotificationPreferences(userId);
    if (existing) {
      return existing;
    }

    return createNotificationPreferences(createDefaultNotificationPreferences(userId));
  },

  async updateNotificationPreferences(
    updates: Partial<Pick<NotificationPreference, "enabled" | "reminderTime" | "timingMode" | "userId">>
  ) {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const current = await this.getNotificationPreferences();

    return updateNotificationPreferencesRow({
      ...current,
      ...updates,
      userId,
      updatedAt: nowTimestamp()
    });
  }
};

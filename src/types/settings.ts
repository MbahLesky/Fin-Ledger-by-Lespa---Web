import type { SyncableEntity, ThemeMode } from "@/types/common";

export interface AppSettings extends Omit<SyncableEntity, "deletedAt"> {
  currencyCode: string;
  themeMode: ThemeMode;
  onboardingComplete: boolean;
}

export interface NotificationPreference extends Omit<SyncableEntity, "deletedAt"> {
  enabled: boolean;
  reminderTime?: string | null;
  timingMode: "daily";
}


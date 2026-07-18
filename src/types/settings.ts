import type { SyncableEntity, ThemeMode } from "@/types/common";

export type AppLanguage = "en" | "fr";

export interface AppSettings extends Omit<SyncableEntity, "deletedAt"> {
  currencyCode: string;
  language: AppLanguage;
  themeMode: ThemeMode;
  onboardingComplete: boolean;
  tutorialCompletedIds: string[];
}

export interface NotificationPreference extends Omit<SyncableEntity, "deletedAt"> {
  enabled: boolean;
  reminderTime?: string | null;
  timingMode: "daily";
}

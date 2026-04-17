import type { SharedEntity, ThemeMode } from "@/types/common";

export interface AppSettings extends Omit<SharedEntity, "deletedAt"> {
  currencyCode: string;
  themeMode: ThemeMode;
  onboardingComplete: boolean;
}

export interface NotificationPreference extends Omit<SharedEntity, "deletedAt"> {
  enabled: boolean;
  reminderTime?: string | null;
  timingMode: "daily";
}

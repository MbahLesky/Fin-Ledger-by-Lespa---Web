import { useLiveQuery } from "dexie-react-hooks";
import { settingsRepository } from "@/db/repositories/settings-repository";

// Onboarding completion lives in local settings (Dexie) — the same source of truth
// the Flutter app uses — not in a remote profile record.
export function useOnboardingStatus() {
  const settings = useLiveQuery(() => settingsRepository.getSettings(), []);
  return {
    loading: settings === undefined,
    complete: Boolean(settings?.onboardingComplete)
  };
}

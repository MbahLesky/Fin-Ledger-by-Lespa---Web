import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";
import { initializeAnalytics } from "@/services/firebase-analytics-service";
import { firebaseAuthService } from "@/services/firebase-auth-service";
import { isFirebaseConfigured } from "@/lib/env";
import { useAppUpdate } from "@/hooks/use-app-update";
import { useLanguageSync } from "@/hooks/use-language-sync";
import { useUnsyncedExitWarning } from "@/hooks/use-unsynced-exit-warning";

export function AppBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const hydrateFromUser = useAuthStore((state) => state.hydrateFromUser);
  const userId = useAuthStore((state) => state.user?.uid);
  const syncWorkspace = useAuthStore((state) => state.syncWorkspace);
  const refreshSync = useSyncStore((state) => state.refresh);

  useLanguageSync();
  useAppUpdate();
  useUnsyncedExitWarning();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Started up front so a GA4 session exists before the first tracked event.
  useEffect(() => {
    void initializeAnalytics();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = firebaseAuthService.onAuthStateChange((user) => {
      void hydrateFromUser(user);
    });

    return () => unsubscribe();
  }, [hydrateFromUser]);

  useEffect(() => {
    function handleConnectivityChange() {
      // Goes through the workspace sync rather than the raw engine so a session
      // that started offline still claims ownership of its seeded rows (and
      // settles its onboarding state) once the network returns.
      if (userId && navigator.onLine) {
        void syncWorkspace(userId);
        return;
      }

      void refreshSync();
    }

    window.addEventListener("online", handleConnectivityChange);
    window.addEventListener("offline", handleConnectivityChange);

    return () => {
      window.removeEventListener("online", handleConnectivityChange);
      window.removeEventListener("offline", handleConnectivityChange);
    };
  }, [refreshSync, syncWorkspace, userId]);

  return null;
}

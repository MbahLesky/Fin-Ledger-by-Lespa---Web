import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";
import { supabaseAuthService } from "@/services/supabase-auth-service";
import { isSupabaseConfigured } from "@/lib/env";

export function AppBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const hydrateFromSession = useAuthStore((state) => state.hydrateFromSession);
  const userId = useAuthStore((state) => state.user?.id);
  const runNow = useSyncStore((state) => state.runNow);
  const refreshSync = useSyncStore((state) => state.refresh);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const {
      data: { subscription }
    } = supabaseAuthService.onAuthStateChange((_event, session) => {
      void hydrateFromSession(session);
    });

    return () => subscription.unsubscribe();
  }, [hydrateFromSession]);

  useEffect(() => {
    function handleConnectivityChange() {
      if (userId && navigator.onLine) {
        void runNow(userId);
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
  }, [refreshSync, runNow, userId]);

  return null;
}


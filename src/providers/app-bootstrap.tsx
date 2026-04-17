import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { ledgerRealtimeService } from "@/services/ledger-realtime-service";
import { supabaseAuthService } from "@/services/supabase-auth-service";
import { isSupabaseConfigured } from "@/lib/env";
import { useRealtimeStore } from "@/store/realtime-store";

export function AppBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const hydrateFromSession = useAuthStore((state) => state.hydrateFromSession);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const userId = useAuthStore((state) => state.user?.id);
  const revision = useRealtimeStore((state) => state.revision);
  const lastTable = useRealtimeStore((state) => state.lastTable);

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
    if (!userId || !isSupabaseConfigured) {
      useRealtimeStore.getState().reset();
      return;
    }

    return ledgerRealtimeService.subscribe(userId);
  }, [userId]);

  useEffect(() => {
    if (userId && lastTable === "profiles") {
      void refreshProfile();
    }
  }, [lastTable, refreshProfile, revision, userId]);

  useEffect(() => {
    function handleConnectivityChange() {
      if (!userId) {
        return;
      }

      if (navigator.onLine) {
        useRealtimeStore.getState().markConnecting();
        useRealtimeStore.getState().markLocalMutation("network");
        return;
      }

      useRealtimeStore.getState().markOffline();
    }

    window.addEventListener("online", handleConnectivityChange);
    window.addEventListener("offline", handleConnectivityChange);

    return () => {
      window.removeEventListener("online", handleConnectivityChange);
      window.removeEventListener("offline", handleConnectivityChange);
    };
  }, [userId]);

  return null;
}

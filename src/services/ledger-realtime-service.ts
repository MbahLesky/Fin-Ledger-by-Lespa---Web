import { assertSupabaseClient } from "@/services/supabase-data-service";
import { useRealtimeStore } from "@/store/realtime-store";

const SHARED_USER_TABLES = [
  "accounts",
  "categories",
  "transactions",
  "transfers",
  "settings",
  "notification_preferences"
] as const;

export const ledgerRealtimeService = {
  subscribe(userId: string) {
    const client = assertSupabaseClient();
    const store = useRealtimeStore.getState();

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      store.markOffline();
    } else {
      store.markConnecting();
    }

    const channel = client.channel(`finance-ledger-web:${userId}`);

    SHARED_USER_TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `user_id=eq.${userId}`
        },
        () => useRealtimeStore.getState().markEvent(table)
      );
    });

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`
      },
      () => useRealtimeStore.getState().markEvent("profiles")
    );

    channel.subscribe((status, error) => {
      const nextStatus = String(status);

      if (nextStatus === "SUBSCRIBED") {
        useRealtimeStore.getState().markConnected();
        return;
      }

      if (nextStatus === "CHANNEL_ERROR" || nextStatus === "TIMED_OUT") {
        useRealtimeStore.getState().markError(
          error?.message ?? "Realtime backend connection was interrupted."
        );
        return;
      }

      if (nextStatus === "CLOSED") {
        useRealtimeStore.getState().markOffline();
      }
    });

    return () => {
      void client.removeChannel(channel);
    };
  }
};

import { useEffect } from "react";
import { useSyncStore } from "@/store/sync-store";

export function useSyncStatus() {
  const pending = useSyncStore((state) => state.pending);
  const failed = useSyncStore((state) => state.failed);
  const processing = useSyncStore((state) => state.processing);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const error = useSyncStore((state) => state.error);
  const refresh = useSyncStore((state) => state.refresh);
  const runNow = useSyncStore((state) => state.runNow);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    pending,
    failed,
    processing,
    lastSyncedAt,
    error,
    refresh,
    runNow
  };
}

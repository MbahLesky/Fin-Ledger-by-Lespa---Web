import { create } from "zustand";
import { syncRepository } from "@/db/repositories/sync-repository";
import { syncEngine } from "@/services/sync-engine";
import type { SyncRunResult, SyncSummary } from "@/types";

interface SyncState extends SyncSummary {
  error: string | null;
  // What the last pull saw, per entity. Shown in Settings so a tester who cannot
  // see their records can report whether the app fetched any.
  lastOutcomes: SyncRunResult["outcomes"];
  refresh: () => Promise<void>;
  // Resolves to true only when the remote pull completed, so sign-in can tell an
  // account with no data apart from an account whose data could not be reached.
  runNow: (userId: string) => Promise<boolean>;
}

const initialSummary: SyncSummary = {
  pending: 0,
  failed: 0,
  processing: false,
  lastSyncedAt: null
};

export const useSyncStore = create<SyncState>((set) => ({
  ...initialSummary,
  error: null,
  lastOutcomes: undefined,
  refresh: async () => {
    const summary = await syncRepository.summarize();
    set({ ...summary });
  },
  runNow: async (userId) => {
    set({ processing: true, error: null });

    try {
      const result = await syncEngine.run(userId);
      const { pulled, outcomes, ...summary } = result;
      set({
        ...summary,
        lastOutcomes: outcomes,
        processing: false,
        error: null
      });
      return pulled;
    } catch (error) {
      set({
        processing: false,
        error: error instanceof Error ? error.message : "Sync failed."
      });
      return false;
    }
  }
}));

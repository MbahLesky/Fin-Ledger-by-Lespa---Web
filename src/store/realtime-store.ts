import { create } from "zustand";

export type RealtimeConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "offline"
  | "error";

interface RealtimeState {
  revision: number;
  status: RealtimeConnectionStatus;
  lastEventAt: string | null;
  lastTable: string | null;
  error: string | null;
  markConnecting: () => void;
  markConnected: () => void;
  markOffline: () => void;
  markError: (message: string) => void;
  markEvent: (tableName: string) => void;
  markLocalMutation: (tableName: string) => void;
  reset: () => void;
}

const initialState = {
  revision: 0,
  status: "idle" as const,
  lastEventAt: null,
  lastTable: null,
  error: null
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  ...initialState,
  markConnecting: () => set({ status: "connecting", error: null }),
  markConnected: () => set({ status: "connected", error: null }),
  markOffline: () => set({ status: "offline", error: null }),
  markError: (message) => set({ status: "error", error: message }),
  markEvent: (tableName) =>
    set((state) => ({
      revision: state.revision + 1,
      status: "connected",
      lastEventAt: new Date().toISOString(),
      lastTable: tableName,
      error: null
    })),
  markLocalMutation: (tableName) =>
    set((state) => ({
      revision: state.revision + 1,
      lastEventAt: new Date().toISOString(),
      lastTable: tableName
    })),
  reset: () => set(initialState)
}));

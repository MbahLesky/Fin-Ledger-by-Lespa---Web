import { create } from "zustand";
import type { ThemeMode } from "@/types";

interface UiState {
  themeMode: ThemeMode;
  isTransactionComposerOpen: boolean;
  setThemeMode: (themeMode: ThemeMode) => void;
  openTransactionComposer: () => void;
  closeTransactionComposer: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  themeMode: "system",
  isTransactionComposerOpen: false,
  setThemeMode: (themeMode) => set({ themeMode }),
  openTransactionComposer: () => set({ isTransactionComposerOpen: true }),
  closeTransactionComposer: () => set({ isTransactionComposerOpen: false })
}));


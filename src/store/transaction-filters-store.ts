import { create } from "zustand";
import { defaultTransactionFilters } from "@/db/repositories/transactions-repository";
import type { TransactionFilters } from "@/types";

interface TransactionFiltersState {
  filters: TransactionFilters;
  setFilters: (updates: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
}

export const useTransactionFiltersStore = create<TransactionFiltersState>((set) => ({
  filters: defaultTransactionFilters,
  setFilters: (updates) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...updates
      }
    })),
  resetFilters: () => set({ filters: defaultTransactionFilters })
}));


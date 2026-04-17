export type TransactionType = "income" | "expense";
export type LedgerEntryType = TransactionType | "transfer";

export type ThemeMode = "light" | "dark" | "system";

export type AccountType =
  | "cash"
  | "bank"
  | "mobile_money"
  | "wallet"
  | "savings"
  | "other";

export interface SharedEntity {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AsyncState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

import type { LedgerEntryType, SharedEntity, TransactionType } from "@/types/common";

export interface TransactionRecord extends SharedEntity {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note: string;
  transactionDate: string;
  reference?: string | null;
}

export interface TransactionFilters {
  query: string;
  type: LedgerEntryType | "all";
  categoryId: string;
  accountId: string;
  range: "all" | "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface TransactionListItem extends TransactionRecord {
  accountName: string;
  accountCurrencyCode: string;
  categoryName: string;
  categoryColorKey?: string | null;
}

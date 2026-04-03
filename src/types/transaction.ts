import type { SyncableEntity, TransactionType } from "@/types/common";

export interface TransactionRecord extends SyncableEntity {
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
  type: TransactionType | "all";
  categoryId: string | "all";
  accountId: string | "all";
  range: "all" | "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface TransactionListItem extends TransactionRecord {
  accountName: string;
  categoryName: string;
  categoryColorKey?: string | null;
}


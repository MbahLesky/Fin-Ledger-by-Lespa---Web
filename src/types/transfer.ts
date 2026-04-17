import type { SharedEntity } from "@/types/common";

export interface TransferRecord extends SharedEntity {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  fee: number;
  note: string;
  transferDate: string;
}

export interface TransferFilters {
  query: string;
  accountId: string;
  range: "all" | "today" | "7d" | "30d" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface TransferListItem extends TransferRecord {
  fromAccountName: string;
  toAccountName: string;
  fromAccountCurrencyCode: string;
  toAccountCurrencyCode: string;
}

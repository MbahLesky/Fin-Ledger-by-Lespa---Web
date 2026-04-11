import type { LedgerEntryType } from "@/types/common";

export interface LedgerHistoryItem {
  id: string;
  kind: "transaction" | "transfer";
  entryType: LedgerEntryType;
  amount: number;
  fee: number;
  note: string;
  occurredAt: string;
  accountLabel: string;
  categoryLabel: string | null;
  accountId: string | null;
  fromAccountId?: string;
  toAccountId?: string;
  currencyCode: string;
}

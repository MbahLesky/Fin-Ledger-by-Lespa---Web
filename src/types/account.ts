import type { AccountType, SyncableEntity } from "@/types/common";

export interface Account extends SyncableEntity {
  name: string;
  type: AccountType;
  initialBalance: number;
  currencyCode: string;
  isDefault: boolean;
  isArchived: boolean;
  displayOrder: number;
}

export interface AccountBalanceSnapshot extends Account {
  currentBalance: number;
  incomeTotal: number;
  expenseTotal: number;
}


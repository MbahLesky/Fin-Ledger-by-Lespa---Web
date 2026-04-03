import { appDb } from "@/db/dexie";
import { createDefaultAccounts } from "@/db/seed/default-records";
import type { Account, AccountBalanceSnapshot, AccountType, TransactionRecord } from "@/types";
import { nowIso } from "@/utils/date-utils";
import { createId } from "@/utils/id";
import { syncRepository } from "@/db/repositories/sync-repository";

async function ensureDefaultAccounts() {
  const count = await appDb.accounts.count();
  if (count === 0) {
    await appDb.accounts.bulkPut(createDefaultAccounts());
  }
}

function calculateBalanceForAccount(account: Account, transactions: TransactionRecord[]) {
  const accountTransactions = transactions.filter((item) => item.accountId === account.id && !item.deletedAt);

  const incomeTotal = accountTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = accountTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    currentBalance: account.initialBalance + incomeTotal - expenseTotal,
    incomeTotal,
    expenseTotal
  };
}

export const accountsRepository = {
  async listActive() {
    await ensureDefaultAccounts();
    return appDb.accounts
      .filter((account) => !account.deletedAt && !account.isArchived)
      .sortBy("displayOrder");
  },

  async listWithBalances(): Promise<AccountBalanceSnapshot[]> {
    const [accounts, transactions] = await Promise.all([this.listActive(), appDb.transactions.toArray()]);

    return accounts.map((account) => ({
      ...account,
      ...calculateBalanceForAccount(account, transactions)
    }));
  },

  async getById(id: string) {
    await ensureDefaultAccounts();
    return appDb.accounts.get(id);
  },

  async createAccount(input: {
    name: string;
    type: AccountType;
    initialBalance: number;
    currencyCode: string;
    userId?: string | null;
  }) {
    const existingAccounts = await this.listActive();
    const timestamp = nowIso();
    const account: Account = {
      id: createId("account"),
      name: input.name.trim(),
      type: input.type,
      initialBalance: input.initialBalance,
      currencyCode: input.currencyCode,
      isDefault: false,
      isArchived: false,
      displayOrder: existingAccounts.length,
      userId: input.userId ?? null,
      remoteId: null,
      syncStatus: "pending",
      syncError: null,
      lastSyncedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null
    };

    await appDb.accounts.add(account);
    await syncRepository.enqueue("accounts", account.id, "create", JSON.stringify(account));
    return account;
  },

  async updateAccount(id: string, updates: Partial<Pick<Account, "name" | "type" | "initialBalance" | "currencyCode" | "isArchived" | "displayOrder" | "userId">>) {
    const current = await appDb.accounts.get(id);
    if (!current) {
      throw new Error("Account not found.");
    }

    const next: Account = {
      ...current,
      ...updates,
      syncStatus: "pending",
      syncError: null,
      updatedAt: nowIso()
    };

    await appDb.accounts.put(next);
    await syncRepository.enqueue("accounts", next.id, "update", JSON.stringify(next));
    return next;
  },

  async saveOpeningBalances(rows: Array<{ id: string; balance: number }>) {
    await Promise.all(
      rows.map((row) =>
        this.updateAccount(row.id, {
          initialBalance: row.balance
        })
      )
    );
  },

  async softDelete(id: string) {
    const account = await appDb.accounts.get(id);
    if (!account || account.isDefault) {
      return;
    }

    const next: Account = {
      ...account,
      isArchived: true,
      deletedAt: nowIso(),
      syncStatus: "pending",
      syncError: null,
      updatedAt: nowIso()
    };

    await appDb.accounts.put(next);
    await syncRepository.enqueue("accounts", next.id, "delete", JSON.stringify(next));
  },

  async stampOwnership(userId: string) {
    const records = await appDb.accounts.toArray();
    await Promise.all(
      records.map((record) =>
        this.updateAccount(record.id, {
          userId
        })
      )
    );
  }
};


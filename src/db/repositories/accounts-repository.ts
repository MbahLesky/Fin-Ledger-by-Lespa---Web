import { belongsToActiveUser } from "@/db/active-user";
import { appDb, getOptionalTable } from "@/db/dexie";
import { createDefaultAccounts } from "@/db/seed/default-records";
import type { Account, AccountBalanceSnapshot, AccountType, TransactionRecord, TransferRecord } from "@/types";
import { nowIso } from "@/utils/date-utils";
import { createId } from "@/utils/id";
import { syncRepository } from "@/db/repositories/sync-repository";

async function ensureDefaultAccounts() {
  const count = await appDb.accounts.count();
  if (count === 0) {
    await appDb.accounts.bulkPut(createDefaultAccounts());
  }
}

function calculateBalanceForAccount(
  account: Account,
  transactions: TransactionRecord[],
  transfers: TransferRecord[]
) {
  const accountTransactions = transactions.filter(
    (item) => item.accountId === account.id && !item.deletedAt && item.affectsAccountBalance
  );
  const outgoingTransfers = transfers.filter((item) => item.fromAccountId === account.id && !item.deletedAt);
  const incomingTransfers = transfers.filter((item) => item.toAccountId === account.id && !item.deletedAt);

  const incomeTotal = accountTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const expenseTotal = accountTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  // Source account is debited amount + sourceFee; destination is credited amount - destinationFee.
  const outgoingTransferTotal = outgoingTransfers.reduce(
    (sum, item) => sum + item.amount + item.sourceFee,
    0
  );
  const incomingTransferTotal = incomingTransfers.reduce(
    (sum, item) => sum + item.amount - item.destinationFee,
    0
  );

  return {
    currentBalance:
      account.openingBalance +
      incomeTotal -
      expenseTotal -
      outgoingTransferTotal +
      incomingTransferTotal,
    incomeTotal,
    expenseTotal
  };
}

export const accountsRepository = {
  async listActive() {
    await ensureDefaultAccounts();
    return appDb.accounts
      .filter((account) => !account.deletedAt && belongsToActiveUser(account))
      .sortBy("displayOrder");
  },

  async listWithBalances(): Promise<AccountBalanceSnapshot[]> {
    const transfersTable = getOptionalTable<TransferRecord>("transfers");
    const [accounts, transactions, transfers] = await Promise.all([
      this.listActive(),
      appDb.transactions.filter(belongsToActiveUser).toArray(),
      transfersTable ? transfersTable.filter(belongsToActiveUser).toArray() : Promise.resolve([])
    ]);

    return accounts.map((account) => ({
      ...account,
      ...calculateBalanceForAccount(account, transactions, transfers)
    }));
  },

  async getById(id: string) {
    await ensureDefaultAccounts();
    const account = await appDb.accounts.get(id);
    return account && belongsToActiveUser(account) ? account : undefined;
  },

  async createAccount(input: {
    name: string;
    type: AccountType;
    openingBalance: number;
    userId?: string | null;
  }) {
    const existingAccounts = await this.listActive();
    const timestamp = nowIso();
    const account: Account = {
      id: createId("account"),
      name: input.name.trim(),
      type: input.type,
      openingBalance: input.openingBalance,
      isDefault: false,
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

  async updateAccount(
    id: string,
    updates: Partial<Pick<Account, "name" | "type" | "openingBalance" | "displayOrder" | "userId">>
  ) {
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
          openingBalance: row.balance
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
      deletedAt: nowIso(),
      syncStatus: "pending",
      syncError: null,
      updatedAt: nowIso()
    };

    await appDb.accounts.put(next);
    await syncRepository.enqueue("accounts", next.id, "delete", JSON.stringify(next));
  },

  // Claims only rows nobody owns yet — the seeded placeholders. Re-stamping rows
  // that already carry a uid would bump `updatedAt` and re-queue the whole ledger
  // on every sign-in, and rows belonging to another account on this browser must
  // never be filed under this user.
  async stampOwnership(userId: string) {
    const records = await appDb.accounts.filter((record) => !record.userId).toArray();
    await Promise.all(
      records.map((record) =>
        this.updateAccount(record.id, {
          userId
        })
      )
    );
  }
};

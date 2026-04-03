import { isWithinInterval, parseISO } from "date-fns";
import { appDb } from "@/db/dexie";
import type { TransactionFilters, TransactionListItem, TransactionRecord } from "@/types";
import { getRangeBounds, nowIso } from "@/utils/date-utils";
import { createId } from "@/utils/id";
import { syncRepository } from "@/db/repositories/sync-repository";

function matchesDateRange(transactionDate: string, filters: TransactionFilters) {
  if (filters.range === "all") {
    return true;
  }

  if (filters.range === "custom" && filters.startDate && filters.endDate) {
    return isWithinInterval(parseISO(transactionDate), {
      start: parseISO(filters.startDate),
      end: parseISO(filters.endDate)
    });
  }

  const bounds = getRangeBounds(filters.range as "today" | "7d" | "30d");
  return isWithinInterval(parseISO(transactionDate), bounds);
}

export const defaultTransactionFilters: TransactionFilters = {
  query: "",
  type: "all",
  categoryId: "all",
  accountId: "all",
  range: "all"
};

export const transactionsRepository = {
  async listActive() {
    const items = await appDb.transactions.filter((item) => !item.deletedAt).toArray();
    return items.sort((left, right) => right.transactionDate.localeCompare(left.transactionDate));
  },

  async listWithRelations(filters: TransactionFilters = defaultTransactionFilters): Promise<TransactionListItem[]> {
    const [transactions, accounts, categories] = await Promise.all([
      this.listActive(),
      appDb.accounts.toArray(),
      appDb.categories.toArray()
    ]);

    return transactions
      .map((transaction) => {
        const account = accounts.find((item) => item.id === transaction.accountId);
        const category = categories.find((item) => item.id === transaction.categoryId);

        return {
          ...transaction,
          accountName: account?.name ?? "Unknown account",
          categoryName: category?.name ?? "Unknown category",
          categoryColorKey: category?.colorKey ?? null
        };
      })
      .filter((transaction) => {
        const matchesQuery =
          filters.query.length === 0 ||
          transaction.note.toLowerCase().includes(filters.query.toLowerCase()) ||
          transaction.accountName.toLowerCase().includes(filters.query.toLowerCase()) ||
          transaction.categoryName.toLowerCase().includes(filters.query.toLowerCase());

        const matchesType = filters.type === "all" || transaction.type === filters.type;
        const matchesCategory =
          filters.categoryId === "all" || transaction.categoryId === filters.categoryId;
        const matchesAccount = filters.accountId === "all" || transaction.accountId === filters.accountId;

        return (
          matchesQuery &&
          matchesType &&
          matchesCategory &&
          matchesAccount &&
          matchesDateRange(transaction.transactionDate, filters)
        );
      });
  },

  async getById(id: string) {
    return appDb.transactions.get(id);
  },

  async createTransaction(input: {
    amount: number;
    type: TransactionRecord["type"];
    accountId: string;
    categoryId: string;
    note?: string;
    transactionDate: string;
    reference?: string | null;
    userId?: string | null;
  }) {
    const timestamp = nowIso();
    const transaction: TransactionRecord = {
      id: createId("txn"),
      amount: input.amount,
      type: input.type,
      accountId: input.accountId,
      categoryId: input.categoryId,
      note: input.note?.trim() ?? "",
      transactionDate: input.transactionDate,
      reference: input.reference ?? null,
      userId: input.userId ?? null,
      remoteId: null,
      syncStatus: "pending",
      syncError: null,
      lastSyncedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null
    };

    await appDb.transactions.add(transaction);
    await syncRepository.enqueue("transactions", transaction.id, "create", JSON.stringify(transaction));
    return transaction;
  },

  async updateTransaction(
    id: string,
    updates: Partial<
      Pick<TransactionRecord, "amount" | "type" | "accountId" | "categoryId" | "note" | "transactionDate" | "reference" | "userId">
    >
  ) {
    const current = await appDb.transactions.get(id);
    if (!current) {
      throw new Error("Transaction not found.");
    }

    const next: TransactionRecord = {
      ...current,
      ...updates,
      syncStatus: "pending",
      syncError: null,
      updatedAt: nowIso()
    };

    await appDb.transactions.put(next);
    await syncRepository.enqueue("transactions", next.id, "update", JSON.stringify(next));
    return next;
  },

  async softDelete(id: string) {
    const current = await appDb.transactions.get(id);
    if (!current) {
      return;
    }

    const next: TransactionRecord = {
      ...current,
      deletedAt: nowIso(),
      syncStatus: "pending",
      syncError: null,
      updatedAt: nowIso()
    };

    await appDb.transactions.put(next);
    await syncRepository.enqueue("transactions", next.id, "delete", JSON.stringify(next));
  },

  async findLikelyDuplicate(input: {
    transactionDate: string;
    type: TransactionRecord["type"];
    amount: number;
    accountId: string;
    note: string;
  }) {
    const transactions = await this.listActive();
    return transactions.find(
      (transaction) =>
        transaction.transactionDate === input.transactionDate &&
        transaction.type === input.type &&
        transaction.amount === input.amount &&
        transaction.accountId === input.accountId &&
        transaction.note.trim().toLowerCase() === input.note.trim().toLowerCase()
    );
  },

  async stampOwnership(userId: string) {
    const records = await appDb.transactions.toArray();
    await Promise.all(
      records.map((record) =>
        this.updateTransaction(record.id, {
          userId
        })
      )
    );
  }
};

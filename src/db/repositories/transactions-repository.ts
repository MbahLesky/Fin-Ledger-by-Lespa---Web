import { isWithinInterval, parseISO } from "date-fns";
import {
  assertOnlineForSharedWrite,
  assertSupabaseClient,
  getAuthenticatedUserId,
  nowTimestamp,
  readNullableString,
  readNumber,
  readString
} from "@/services/supabase-data-service";
import { useRealtimeStore } from "@/store/realtime-store";
import type { TransactionFilters, TransactionListItem, TransactionRecord, TransactionType } from "@/types";
import { getRangeBounds } from "@/utils/date-utils";
import { createUuid } from "@/utils/id";

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

function fromTransactionRow(row: Record<string, unknown>): TransactionRecord {
  return {
    id: readString(row, "id"),
    userId: readString(row, "user_id"),
    amount: readNumber(row, "amount"),
    type: readString(row, "type") as TransactionType,
    accountId: readString(row, "account_id"),
    categoryId: readString(row, "category_id"),
    note: readString(row, "note"),
    transactionDate: readString(row, "transaction_date"),
    reference: readNullableString(row, "reference"),
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at"),
    deletedAt: readNullableString(row, "deleted_at")
  };
}

function toTransactionPayload(transaction: TransactionRecord) {
  return {
    id: transaction.id,
    user_id: transaction.userId,
    account_id: transaction.accountId,
    category_id: transaction.categoryId,
    type: transaction.type,
    amount: transaction.amount,
    note: transaction.note,
    transaction_date: transaction.transactionDate,
    reference: transaction.reference ?? null,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
    deleted_at: transaction.deletedAt ?? null
  };
}

function notifyTransactionsChanged() {
  useRealtimeStore.getState().markLocalMutation("transactions");
}

async function fetchTransactionById(userId: string, id: string) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromTransactionRow(data) : undefined;
}

async function fetchRelationRows(userId: string) {
  const client = assertSupabaseClient();
  const [accountsResult, categoriesResult] = await Promise.all([
    client
      .from("accounts")
      .select("id,name,currency_code")
      .eq("user_id", userId)
      .is("deleted_at", null),
    client
      .from("categories")
      .select("id,name,color_key")
      .eq("user_id", userId)
      .is("deleted_at", null)
  ]);

  if (accountsResult.error) {
    throw new Error(accountsResult.error.message);
  }

  if (categoriesResult.error) {
    throw new Error(categoriesResult.error.message);
  }

  return {
    accounts: (accountsResult.data ?? []) as Array<Record<string, unknown>>,
    categories: (categoriesResult.data ?? []) as Array<Record<string, unknown>>
  };
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
    const userId = await getAuthenticatedUserId();
    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("transaction_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(fromTransactionRow);
  },

  async listWithRelations(filters: TransactionFilters = defaultTransactionFilters): Promise<TransactionListItem[]> {
    const userId = await getAuthenticatedUserId();
    const [transactions, relations] = await Promise.all([
      this.listActive(),
      fetchRelationRows(userId)
    ]);

    return transactions
      .map((transaction) => {
        const account = relations.accounts.find((item) => readString(item, "id") === transaction.accountId);
        const category = relations.categories.find((item) => readString(item, "id") === transaction.categoryId);

        return {
          ...transaction,
          accountName: account ? readString(account, "name") : "Unknown account",
          accountCurrencyCode: account ? readString(account, "currency_code", "USD") : "USD",
          categoryName: category ? readString(category, "name") : "Unknown category",
          categoryColorKey: category ? readNullableString(category, "color_key") : null
        };
      })
      .filter((transaction) => {
        const query = filters.query.trim().toLowerCase();
        const matchesQuery =
          query.length === 0 ||
          transaction.note.toLowerCase().includes(query) ||
          transaction.accountName.toLowerCase().includes(query) ||
          transaction.categoryName.toLowerCase().includes(query);

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
    const userId = await getAuthenticatedUserId();
    return fetchTransactionById(userId, id);
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
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const timestamp = nowTimestamp();
    const transaction: TransactionRecord = {
      id: createUuid(),
      amount: input.amount,
      type: input.type,
      accountId: input.accountId,
      categoryId: input.categoryId,
      note: input.note?.trim() ?? "",
      transactionDate: input.transactionDate,
      reference: input.reference ?? null,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null
    };

    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("transactions")
      .insert(toTransactionPayload(transaction))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyTransactionsChanged();
    return fromTransactionRow(data);
  },

  async updateTransaction(
    id: string,
    updates: Partial<
      Pick<TransactionRecord, "amount" | "type" | "accountId" | "categoryId" | "note" | "transactionDate" | "reference" | "userId" | "deletedAt">
    >
  ) {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const current = await fetchTransactionById(userId, id);

    if (!current) {
      throw new Error("Transaction not found.");
    }

    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("transactions")
      .update(
        toTransactionPayload({
          ...current,
          ...updates,
          userId,
          updatedAt: nowTimestamp()
        })
      )
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyTransactionsChanged();
    return fromTransactionRow(data);
  },

  async softDelete(id: string) {
    const current = await this.getById(id);
    if (!current) {
      return;
    }

    await this.updateTransaction(id, {
      deletedAt: nowTimestamp()
    });
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
        transaction.transactionDate.slice(0, 10) === input.transactionDate.slice(0, 10) &&
        transaction.type === input.type &&
        transaction.amount === input.amount &&
        transaction.accountId === input.accountId &&
        transaction.note.trim().toLowerCase() === input.note.trim().toLowerCase()
    );
  }
};

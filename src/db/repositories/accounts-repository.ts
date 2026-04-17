import { createDefaultAccounts } from "@/db/seed/default-records";
import { settingsRepository } from "@/db/repositories/settings-repository";
import {
  assertOnlineForSharedWrite,
  assertSupabaseClient,
  getAuthenticatedUserId,
  nowTimestamp,
  readBoolean,
  readNullableString,
  readNumber,
  readString
} from "@/services/supabase-data-service";
import { useRealtimeStore } from "@/store/realtime-store";
import type { Account, AccountBalanceSnapshot, AccountType } from "@/types";
import { createUuid } from "@/utils/id";

function fromAccountRow(row: Record<string, unknown>): Account {
  return {
    id: readString(row, "id"),
    userId: readString(row, "user_id"),
    name: readString(row, "name"),
    type: readString(row, "type") as AccountType,
    initialBalance: readNumber(row, "initial_balance"),
    currencyCode: readString(row, "currency_code", "USD"),
    isDefault: readBoolean(row, "is_default"),
    isArchived: readBoolean(row, "is_archived"),
    displayOrder: readNumber(row, "display_order"),
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at"),
    deletedAt: readNullableString(row, "deleted_at")
  };
}

function toAccountPayload(account: Account) {
  return {
    id: account.id,
    user_id: account.userId,
    name: account.name,
    type: account.type,
    initial_balance: account.initialBalance,
    currency_code: account.currencyCode,
    is_default: account.isDefault,
    is_archived: account.isArchived,
    display_order: account.displayOrder,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
    deleted_at: account.deletedAt
  };
}

function notifyAccountsChanged() {
  useRealtimeStore.getState().markLocalMutation("accounts");
}

async function ensureDefaultAccounts(userId: string) {
  const client = assertSupabaseClient();
  const { data: activeRows, error } = await client
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if ((activeRows ?? []).length > 0) {
    return;
  }

  const settings = await settingsRepository.getSettings();
  const defaults = createDefaultAccounts(userId, settings.currencyCode);
  const defaultIds = defaults.map((account) => account.id);
  const { data: existingRows, error: existingError } = await client
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .in("id", defaultIds);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingIds = new Set((existingRows ?? []).map((row) => readString(row, "id")));
  const missingDefaults = defaults.filter((account) => !existingIds.has(account.id));

  if (missingDefaults.length > 0) {
    const { error: seedError } = await client
      .from("accounts")
      .insert(missingDefaults.map(toAccountPayload));

    if (seedError) {
      throw new Error(seedError.message);
    }

    notifyAccountsChanged();
  }
}

async function fetchAccountById(userId: string, id: string) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromAccountRow(data) : undefined;
}

async function fetchBalanceInputs(userId: string) {
  const client = assertSupabaseClient();
  const [transactionsResult, transfersResult] = await Promise.all([
    client
      .from("transactions")
      .select("account_id,type,amount,deleted_at")
      .eq("user_id", userId)
      .is("deleted_at", null),
    client
      .from("transfers")
      .select("from_account_id,to_account_id,amount,fee,deleted_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
  ]);

  if (transactionsResult.error) {
    throw new Error(transactionsResult.error.message);
  }

  if (transfersResult.error) {
    throw new Error(transfersResult.error.message);
  }

  return {
    transactions: (transactionsResult.data ?? []) as Array<Record<string, unknown>>,
    transfers: (transfersResult.data ?? []) as Array<Record<string, unknown>>
  };
}

function calculateBalanceForAccount(
  account: Account,
  transactions: Array<Record<string, unknown>>,
  transfers: Array<Record<string, unknown>>
) {
  const accountTransactions = transactions.filter((item) => readString(item, "account_id") === account.id);
  const outgoingTransfers = transfers.filter((item) => readString(item, "from_account_id") === account.id);
  const incomingTransfers = transfers.filter((item) => readString(item, "to_account_id") === account.id);

  const incomeTotal = accountTransactions
    .filter((item) => readString(item, "type") === "income")
    .reduce((sum, item) => sum + readNumber(item, "amount"), 0);
  const expenseTotal = accountTransactions
    .filter((item) => readString(item, "type") === "expense")
    .reduce((sum, item) => sum + readNumber(item, "amount"), 0);
  const outgoingTransferTotal = outgoingTransfers.reduce(
    (sum, item) => sum + readNumber(item, "amount") + readNumber(item, "fee"),
    0
  );
  const incomingTransferTotal = incomingTransfers.reduce(
    (sum, item) => sum + readNumber(item, "amount"),
    0
  );

  return {
    currentBalance:
      account.initialBalance +
      incomeTotal -
      expenseTotal -
      outgoingTransferTotal +
      incomingTransferTotal,
    incomeTotal,
    expenseTotal
  };
}

export const accountsRepository = {
  async ensureDefaults(userId?: string) {
    await ensureDefaultAccounts(userId ?? (await getAuthenticatedUserId()));
  },

  async listActive() {
    const userId = await getAuthenticatedUserId();
    await ensureDefaultAccounts(userId);

    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("is_archived", false)
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(fromAccountRow);
  },

  async listWithBalances(): Promise<AccountBalanceSnapshot[]> {
    const userId = await getAuthenticatedUserId();
    const [accounts, balanceInputs] = await Promise.all([
      this.listActive(),
      fetchBalanceInputs(userId)
    ]);

    return accounts.map((account) => ({
      ...account,
      ...calculateBalanceForAccount(account, balanceInputs.transactions, balanceInputs.transfers)
    }));
  },

  async getById(id: string) {
    const userId = await getAuthenticatedUserId();
    await ensureDefaultAccounts(userId);
    return fetchAccountById(userId, id);
  },

  async createAccount(input: {
    name: string;
    type: AccountType;
    initialBalance: number;
    currencyCode: string;
    userId?: string | null;
  }) {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const existingAccounts = await this.listActive();
    const timestamp = nowTimestamp();
    const account: Account = {
      id: createUuid(),
      name: input.name.trim(),
      type: input.type,
      initialBalance: input.initialBalance,
      currencyCode: input.currencyCode,
      isDefault: false,
      isArchived: false,
      displayOrder: existingAccounts.length,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null
    };

    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("accounts")
      .insert(toAccountPayload(account))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyAccountsChanged();
    return fromAccountRow(data);
  },

  async updateAccount(
    id: string,
    updates: Partial<
      Pick<Account, "name" | "type" | "initialBalance" | "currencyCode" | "isArchived" | "displayOrder" | "userId" | "deletedAt">
    >
  ) {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const current = await fetchAccountById(userId, id);

    if (!current) {
      throw new Error("Account not found.");
    }

    const payload = toAccountPayload({
      ...current,
      ...updates,
      userId,
      updatedAt: nowTimestamp()
    });

    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("accounts")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyAccountsChanged();
    return fromAccountRow(data);
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

  async updateDefaultAccountCurrency(currencyCode: string) {
    const defaultAccounts = (await this.listActive()).filter(
      (account) => account.isDefault && account.currencyCode !== currencyCode
    );

    await Promise.all(
      defaultAccounts.map((account) =>
        this.updateAccount(account.id, {
          currencyCode
        })
      )
    );
  },

  async softDelete(id: string) {
    assertOnlineForSharedWrite();
    const account = await this.getById(id);
    if (!account || account.isDefault) {
      return;
    }

    await this.updateAccount(id, {
      isArchived: true,
      deletedAt: nowTimestamp()
    });
  }
};

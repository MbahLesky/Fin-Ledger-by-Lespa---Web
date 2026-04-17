import { isWithinInterval, parseISO } from "date-fns";
import { accountsRepository } from "@/db/repositories/accounts-repository";
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
import type { TransferFilters, TransferListItem, TransferRecord } from "@/types";
import { getRangeBounds } from "@/utils/date-utils";
import { createUuid } from "@/utils/id";

function matchesDateRange(transferDate: string, filters: TransferFilters) {
  if (filters.range === "all") {
    return true;
  }

  if (filters.range === "custom" && filters.startDate && filters.endDate) {
    return isWithinInterval(parseISO(transferDate), {
      start: parseISO(filters.startDate),
      end: parseISO(filters.endDate)
    });
  }

  const bounds = getRangeBounds(filters.range as "today" | "7d" | "30d");
  return isWithinInterval(parseISO(transferDate), bounds);
}

function fromTransferRow(row: Record<string, unknown>): TransferRecord {
  return {
    id: readString(row, "id"),
    userId: readString(row, "user_id"),
    fromAccountId: readString(row, "from_account_id"),
    toAccountId: readString(row, "to_account_id"),
    amount: readNumber(row, "amount"),
    fee: readNumber(row, "fee"),
    note: readString(row, "note"),
    transferDate: readString(row, "transfer_date"),
    createdAt: readString(row, "created_at"),
    updatedAt: readString(row, "updated_at"),
    deletedAt: readNullableString(row, "deleted_at")
  };
}

function toTransferPayload(transfer: TransferRecord) {
  return {
    id: transfer.id,
    user_id: transfer.userId,
    from_account_id: transfer.fromAccountId,
    to_account_id: transfer.toAccountId,
    amount: transfer.amount,
    fee: transfer.fee,
    note: transfer.note,
    transfer_date: transfer.transferDate,
    created_at: transfer.createdAt,
    updated_at: transfer.updatedAt,
    deleted_at: transfer.deletedAt ?? null
  };
}

function notifyTransfersChanged() {
  useRealtimeStore.getState().markLocalMutation("transfers");
}

async function fetchTransferById(userId: string, id: string) {
  const client = assertSupabaseClient();
  const { data, error } = await client
    .from("transfers")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromTransferRow(data) : undefined;
}

export const defaultTransferFilters: TransferFilters = {
  query: "",
  accountId: "all",
  range: "all"
};

export const transfersRepository = {
  async listActive() {
    const userId = await getAuthenticatedUserId();
    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("transfers")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("transfer_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(fromTransferRow);
  },

  async listWithRelations(filters: TransferFilters = defaultTransferFilters): Promise<TransferListItem[]> {
    const [transfers, accounts] = await Promise.all([
      this.listActive(),
      accountsRepository.listActive()
    ]);

    return transfers
      .map((transfer) => {
        const fromAccount = accounts.find((item) => item.id === transfer.fromAccountId);
        const toAccount = accounts.find((item) => item.id === transfer.toAccountId);

        return {
          ...transfer,
          fromAccountName: fromAccount?.name ?? "Unknown source account",
          toAccountName: toAccount?.name ?? "Unknown destination account",
          fromAccountCurrencyCode: fromAccount?.currencyCode ?? "USD",
          toAccountCurrencyCode: toAccount?.currencyCode ?? "USD"
        };
      })
      .filter((transfer) => {
        const query = filters.query.trim().toLowerCase();
        const matchesQuery =
          query.length === 0 ||
          transfer.note.toLowerCase().includes(query) ||
          transfer.fromAccountName.toLowerCase().includes(query) ||
          transfer.toAccountName.toLowerCase().includes(query);
        const matchesAccount =
          filters.accountId === "all" ||
          transfer.fromAccountId === filters.accountId ||
          transfer.toAccountId === filters.accountId;

        return matchesQuery && matchesAccount && matchesDateRange(transfer.transferDate, filters);
      });
  },

  async getById(id: string) {
    const userId = await getAuthenticatedUserId();
    return fetchTransferById(userId, id);
  },

  async createTransfer(input: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    fee?: number;
    note?: string;
    transferDate: string;
    userId?: string | null;
  }) {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();

    if (!input.fromAccountId || !input.toAccountId || !input.transferDate) {
      throw new Error("From account, to account, and date are required.");
    }

    if (input.fromAccountId === input.toAccountId) {
      throw new Error("Choose two different accounts for a transfer.");
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error("Transfer amount must be greater than zero.");
    }

    const fee = Number.isFinite(input.fee) ? Number(input.fee) : 0;
    if (fee < 0) {
      throw new Error("Transfer fee cannot be negative.");
    }

    const [fromAccount, toAccount, balances] = await Promise.all([
      accountsRepository.getById(input.fromAccountId),
      accountsRepository.getById(input.toAccountId),
      accountsRepository.listWithBalances()
    ]);

    if (!fromAccount || fromAccount.deletedAt || fromAccount.isArchived) {
      throw new Error("Source account is unavailable.");
    }

    if (!toAccount || toAccount.deletedAt || toAccount.isArchived) {
      throw new Error("Destination account is unavailable.");
    }

    const sourceBalance = balances.find((item) => item.id === input.fromAccountId)?.currentBalance ?? 0;
    const totalDebit = input.amount + fee;

    if (sourceBalance < totalDebit) {
      throw new Error("Insufficient balance in the source account for amount plus fee.");
    }

    const timestamp = nowTimestamp();
    const transfer: TransferRecord = {
      id: createUuid(),
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount: input.amount,
      fee,
      note: input.note?.trim() ?? "",
      transferDate: input.transferDate,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null
    };

    const client = assertSupabaseClient();
    const { data, error } = await client
      .from("transfers")
      .insert(toTransferPayload(transfer))
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyTransfersChanged();
    return fromTransferRow(data);
  },

  async softDelete(id: string) {
    assertOnlineForSharedWrite();
    const userId = await getAuthenticatedUserId();
    const current = await fetchTransferById(userId, id);
    if (!current) {
      return;
    }

    const client = assertSupabaseClient();
    const { error } = await client
      .from("transfers")
      .update(
        toTransferPayload({
          ...current,
          deletedAt: nowTimestamp(),
          updatedAt: nowTimestamp()
        })
      )
      .eq("user_id", userId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    notifyTransfersChanged();
  }
};

import { isWithinInterval, parseISO } from "date-fns";
import { appDb, getOptionalTable } from "@/db/dexie";
import { accountsRepository } from "@/db/repositories/accounts-repository";
import { syncRepository } from "@/db/repositories/sync-repository";
import type { TransferFilters, TransferListItem, TransferRecord } from "@/types";
import { getRangeBounds, nowIso } from "@/utils/date-utils";
import { createId } from "@/utils/id";

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

export const defaultTransferFilters: TransferFilters = {
  query: "",
  accountId: "all",
  range: "all"
};

function getTransfersTable() {
  return getOptionalTable<TransferRecord>("transfers");
}

export const transfersRepository = {
  async listActive() {
    const transfersTable = getTransfersTable();
    if (!transfersTable) {
      return [];
    }

    const items = await transfersTable.filter((item) => !item.deletedAt).toArray();
    return items.sort((left, right) => right.transferDate.localeCompare(left.transferDate));
  },

  async listWithRelations(filters: TransferFilters = defaultTransferFilters): Promise<TransferListItem[]> {
    const [transfers, accounts] = await Promise.all([this.listActive(), appDb.accounts.toArray()]);

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
    const transfersTable = getTransfersTable();
    if (!transfersTable) {
      return undefined;
    }

    return transfersTable.get(id);
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
    const transfersTable = getTransfersTable();
    if (!transfersTable) {
      throw new Error("Transfer storage is unavailable. Refresh the app and try again.");
    }

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
      appDb.accounts.get(input.fromAccountId),
      appDb.accounts.get(input.toAccountId),
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

    const timestamp = nowIso();
    const transfer: TransferRecord = {
      id: createId("transfer"),
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount: input.amount,
      fee,
      note: input.note?.trim() ?? "",
      transferDate: input.transferDate,
      userId: input.userId ?? null,
      remoteId: null,
      syncStatus: "pending",
      syncError: null,
      lastSyncedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null
    };

    await transfersTable.add(transfer);
    await syncRepository.enqueue("transfers", transfer.id, "create", JSON.stringify(transfer));
    return transfer;
  },

  async softDelete(id: string) {
    const transfersTable = getTransfersTable();
    if (!transfersTable) {
      return;
    }

    const current = await transfersTable.get(id);
    if (!current) {
      return;
    }

    const next: TransferRecord = {
      ...current,
      deletedAt: nowIso(),
      syncStatus: "pending",
      syncError: null,
      updatedAt: nowIso()
    };

    await transfersTable.put(next);
    await syncRepository.enqueue("transfers", next.id, "delete", JSON.stringify(next));
  },

  async stampOwnership(userId: string) {
    const transfersTable = getTransfersTable();
    if (!transfersTable) {
      return;
    }

    const records = await transfersTable.toArray();
    await Promise.all(
      records.map((record) =>
        transfersTable.put({
          ...record,
          userId,
          syncStatus: "pending",
          syncError: null,
          updatedAt: nowIso()
        })
      )
    );

    await Promise.all(
      records.map((record) => syncRepository.enqueue("transfers", record.id, "update"))
    );
  }
};

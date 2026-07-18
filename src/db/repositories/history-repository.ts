import { isWithinInterval, parseISO } from "date-fns";
import { transfersRepository } from "@/db/repositories/transfers-repository";
import { transactionsRepository } from "@/db/repositories/transactions-repository";
import type { LedgerHistoryItem, TransactionFilters } from "@/types";
import { getRangeBounds } from "@/utils/date-utils";

function matchesDateRange(date: string, filters: TransactionFilters) {
  if (filters.range === "all") {
    return true;
  }

  if (filters.range === "custom" && filters.startDate && filters.endDate) {
    return isWithinInterval(parseISO(date), {
      start: parseISO(filters.startDate),
      end: parseISO(filters.endDate)
    });
  }

  const bounds = getRangeBounds(filters.range as "today" | "7d" | "30d");
  return isWithinInterval(parseISO(date), bounds);
}

export const historyRepository = {
  async listWithRelations(filters: TransactionFilters): Promise<LedgerHistoryItem[]> {
    const [transactions, transfers] = await Promise.all([
      transactionsRepository.listWithRelations(),
      transfersRepository.listWithRelations()
    ]);

    const query = filters.query.trim().toLowerCase();

    const transactionItems: LedgerHistoryItem[] = transactions
      .filter((transaction) => {
        const matchesQuery =
          query.length === 0 ||
          transaction.description.toLowerCase().includes(query) ||
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
      })
      .map((transaction) => ({
        id: transaction.id,
        kind: "transaction",
        entryType: transaction.type,
        amount: transaction.amount,
        fee: 0,
        description: transaction.description,
        occurredAt: transaction.transactionDate,
        accountLabel: transaction.accountName,
        categoryLabel: transaction.categoryName,
        categoryIconKey: transaction.categoryIconKey,
        accountId: transaction.accountId,
        currencyCode: transaction.accountCurrencyCode
      }));

    const transferItems: LedgerHistoryItem[] = transfers
      .filter((transfer) => {
        const matchesQuery =
          query.length === 0 ||
          transfer.description.toLowerCase().includes(query) ||
          transfer.fromAccountName.toLowerCase().includes(query) ||
          transfer.toAccountName.toLowerCase().includes(query);

        const matchesType = filters.type === "all" || filters.type === "transfer";
        const matchesCategory = filters.categoryId === "all";
        const matchesAccount =
          filters.accountId === "all" ||
          transfer.fromAccountId === filters.accountId ||
          transfer.toAccountId === filters.accountId;

        return (
          matchesQuery &&
          matchesType &&
          matchesCategory &&
          matchesAccount &&
          matchesDateRange(transfer.transferDate, filters)
        );
      })
      .map((transfer) => ({
        id: transfer.id,
        kind: "transfer",
        entryType: "transfer",
        amount: transfer.amount,
        fee: transfer.fee,
        description: transfer.description,
        occurredAt: transfer.transferDate,
        accountLabel: `${transfer.fromAccountName} -> ${transfer.toAccountName}`,
        categoryLabel: "Transfer",
        categoryIconKey: null,
        accountId: null,
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        currencyCode: transfer.fromAccountCurrencyCode
      }));

    return [...transactionItems, ...transferItems].sort((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt)
    );
  }
};

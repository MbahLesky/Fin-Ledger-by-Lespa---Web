import { format, parseISO, startOfMonth } from "date-fns";
import { transactionsRepository } from "@/db/repositories/transactions-repository";
import { transfersRepository } from "@/db/repositories/transfers-repository";

export const analyticsService = {
  async getSnapshots() {
    const [transactions, transfers] = await Promise.all([
      transactionsRepository.listWithRelations(),
      transfersRepository.listActive()
    ]);

    const monthlyTrendMap = new Map<string, { label: string; income: number; expense: number }>();
    const categoryBreakdownMap = new Map<string, number>();

    transactions.forEach((transaction) => {
      const monthKey = format(startOfMonth(parseISO(transaction.transactionDate)), "yyyy-MM");
      const label = format(parseISO(transaction.transactionDate), "MMM yyyy");
      const bucket = monthlyTrendMap.get(monthKey) ?? {
        label,
        income: 0,
        expense: 0
      };

      if (transaction.type === "income") {
        bucket.income += transaction.amount;
      } else {
        bucket.expense += transaction.amount;
        categoryBreakdownMap.set(
          transaction.categoryName,
          (categoryBreakdownMap.get(transaction.categoryName) ?? 0) + transaction.amount
        );
      }

      monthlyTrendMap.set(monthKey, bucket);
    });

    transfers
      .filter((transfer) => transfer.fee > 0)
      .forEach((transfer) => {
        const monthKey = format(startOfMonth(parseISO(transfer.transferDate)), "yyyy-MM");
        const label = format(parseISO(transfer.transferDate), "MMM yyyy");
        const bucket = monthlyTrendMap.get(monthKey) ?? {
          label,
          income: 0,
          expense: 0
        };

        bucket.expense += transfer.fee;
        categoryBreakdownMap.set("Transfer fees", (categoryBreakdownMap.get("Transfer fees") ?? 0) + transfer.fee);
        monthlyTrendMap.set(monthKey, bucket);
      });

    const monthlyTrend = Array.from(monthlyTrendMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => value);
    const categoryBreakdown = Array.from(categoryBreakdownMap.entries())
      .map(([name, value]) => ({
        name,
        value
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6);

    const totals = {
      income: transactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      expense: transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0) +
        transfers.reduce((sum, transfer) => sum + transfer.fee, 0)
    };

    return {
      monthlyTrend,
      categoryBreakdown,
      totals
    };
  }
};

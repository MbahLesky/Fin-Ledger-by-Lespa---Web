import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Filter, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/data-display/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layout/page-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountsRepository } from "@/db/repositories/accounts-repository";
import { categoriesRepository } from "@/db/repositories/categories-repository";
import { transactionsRepository } from "@/db/repositories/transactions-repository";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { ROUTES } from "@/routes/route-constants";
import { useTransactionFiltersStore } from "@/store/transaction-filters-store";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency } from "@/utils/formatting";
import { useNavigate } from "react-router-dom";

export function TransactionsPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const filters = useTransactionFiltersStore((state) => state.filters);
  const setFilters = useTransactionFiltersStore((state) => state.setFilters);
  const accounts = useLiveQuery(() => accountsRepository.listActive(), []);
  const categories = useLiveQuery(() => categoriesRepository.listActive(), []);
  const transactions = useLiveQuery(() => transactionsRepository.listWithRelations(filters), [filters]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingTransaction = useMemo(
    () => transactions?.find((transaction) => transaction.id === editingId),
    [editingId, transactions]
  );

  return (
    <PageShell
      title="Transactions"
      description="Search, filter, edit, and remove transaction history while the ledger remains local-first."
      action={
        <Button onClick={() => navigate(ROUTES.addTransaction)}>
          <Plus className="size-4" />
          Add transaction
        </Button>
      }
    >
      <div className="grid gap-4 rounded-xl border border-border/70 bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search note, account, or category"
            value={filters.query}
            onChange={(event) => setFilters({ query: event.target.value })}
          />
        </div>

        <Select value={filters.type} onValueChange={(value) => setFilters({ type: value as typeof filters.type })}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId}
          onValueChange={(value) => setFilters({ categoryId: value as typeof filters.categoryId })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(categories ?? []).map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          <Select
            value={filters.accountId}
            onValueChange={(value) => setFilters({ accountId: value as typeof filters.accountId })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {(accounts ?? []).map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.range}
            onValueChange={(value) => setFilters({ range: value as typeof filters.range })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {(transactions ?? []).length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No transactions match the current view"
          description="Try another filter, add your first transaction, or import a CSV to populate the ledger."
          actionLabel="Add transaction"
          onAction={() => navigate(ROUTES.addTransaction)}
        />
      ) : (
        <div className="rounded-xl border border-border/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.transactionDate.slice(0, 10)}</TableCell>
                  <TableCell>{transaction.categoryName}</TableCell>
                  <TableCell>{transaction.accountName}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {transaction.note || "No note"}
                  </TableCell>
                  <TableCell className={transaction.type === "income" ? "text-secondary" : "text-accent"}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(transaction.id)}>
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This uses a soft delete so the change can sync safely later. The row will disappear from your active history immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void transactionsRepository.softDelete(transaction.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(editingTransaction)} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editingTransaction ? (
            <TransactionForm
              initialValue={editingTransaction}
              userId={userId}
              submitLabel="Save changes"
              onSubmitted={() => setEditingId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

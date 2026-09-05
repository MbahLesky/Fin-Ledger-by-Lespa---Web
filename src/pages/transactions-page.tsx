import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRightLeft, Filter, Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/data-display/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layout/page-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountsRepository } from "@/db/repositories/accounts-repository";
import { categoriesRepository } from "@/db/repositories/categories-repository";
import { historyRepository } from "@/db/repositories/history-repository";
import { transfersRepository } from "@/db/repositories/transfers-repository";
import { settingsRepository } from "@/db/repositories/settings-repository";
import { transactionsRepository } from "@/db/repositories/transactions-repository";
import {
  EntryTypeBadge,
  HistoryEntryActions,
  HistoryEntryCard,
  amountToneClass,
  formatSignedAmount
} from "@/features/transactions/history-entry-parts";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { TransferForm } from "@/features/transfers/transfer-form";
import { ROUTES } from "@/routes/route-constants";
import { useTransactionFiltersStore } from "@/store/transaction-filters-store";
import { useAuthStore } from "@/store/auth-store";
import { formatCurrency } from "@/utils/formatting";
import { useNavigate } from "react-router-dom";

export function TransactionsPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.uid ?? null);
  const filters = useTransactionFiltersStore((state) => state.filters);
  const setFilters = useTransactionFiltersStore((state) => state.setFilters);
  const accounts = useLiveQuery(() => accountsRepository.listActive(), []);
  const categories = useLiveQuery(() => categoriesRepository.listActive(), []);
  const historyItems = useLiveQuery(() => historyRepository.listWithRelations(filters), [filters]);
  const settings = useLiveQuery(() => settingsRepository.getSettings(), []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null);
  const editingTransaction = useLiveQuery(
    () => (editingId ? transactionsRepository.getById(editingId) : undefined),
    [editingId]
  );
  const editingTransfer = useLiveQuery(
    () => (editingTransferId ? transfersRepository.getById(editingTransferId) : undefined),
    [editingTransferId]
  );
  const selectedCurrencyCode = settings?.currencyCode ?? "XAF";
  const hasRows = (historyItems ?? []).length > 0;

  return (
    <PageShell
      title="Transactions"
      description="Search, filter, edit, and remove transaction history while the ledger remains local-first."
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate(ROUTES.transfer)}>
            <ArrowRightLeft className="size-4" />
            Transfer
          </Button>
          <Button onClick={() => navigate(ROUTES.addTransaction)}>
            <Plus className="size-4" />
            Add transaction
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 rounded-xl border border-border/70 bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search note, account, category, or transfer path"
            value={filters.query}
            onChange={(event) => setFilters({ query: event.target.value })}
          />
        </div>

        <Select
          value={filters.type}
          onValueChange={(value) =>
            setFilters({
              type: value as typeof filters.type,
              ...(value === "transfer" ? { categoryId: "all" as const } : {})
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId}
          onValueChange={(value) => setFilters({ categoryId: value as typeof filters.categoryId })}
          disabled={filters.type === "transfer"}
        >
          <SelectTrigger>
            <SelectValue placeholder={filters.type === "transfer" ? "Category not used" : "Category"} />
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

      {!hasRows ? (
        <EmptyState
          icon={Filter}
          title="No ledger records match the current view"
          description="Try another filter, add your first transaction, create a transfer, or import a CSV to populate the ledger."
          actionLabel="Add transaction"
          onAction={() => navigate(ROUTES.addTransaction)}
        />
      ) : (
        <>
          {/* Phones get cards: a seven-column table can only be read here by
              scrolling sideways, which hides the amount — the one column that
              matters most. */}
          <div className="grid gap-3 md:hidden">
            {historyItems?.map((item) => (
              <HistoryEntryCard
                key={`${item.kind}-${item.id}`}
                item={item}
                fallbackCurrencyCode={selectedCurrencyCode}
                onEdit={() =>
                  item.kind === "transaction" ? setEditingId(item.id) : setEditingTransferId(item.id)
                }
                onDelete={() =>
                  void (item.kind === "transaction"
                    ? transactionsRepository.softDelete(item.id)
                    : transfersRepository.softDelete(item.id))
                }
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-border/70 bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category / Path</TableHead>
                  <TableHead>Account scope</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyItems?.map((item) => (
                  <TableRow key={`${item.kind}-${item.id}`}>
                    <TableCell className="font-medium">{item.occurredAt.slice(0, 10)}</TableCell>
                    <TableCell>
                      <EntryTypeBadge entryType={item.entryType} />
                    </TableCell>
                    <TableCell>{item.categoryLabel ?? "-"}</TableCell>
                    <TableCell>{item.accountLabel}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {item.description || "No note"}
                    </TableCell>
                    <TableCell className={amountToneClass(item.entryType)}>
                      {formatSignedAmount(item, selectedCurrencyCode)}
                      {item.kind === "transfer" && item.fee > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Fee {formatCurrency(item.fee, item.currencyCode || selectedCurrencyCode)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <HistoryEntryActions
                        item={item}
                        className="justify-end"
                        onEdit={() =>
                          item.kind === "transaction"
                            ? setEditingId(item.id)
                            : setEditingTransferId(item.id)
                        }
                        onDelete={() =>
                          void (item.kind === "transaction"
                            ? transactionsRepository.softDelete(item.id)
                            : transfersRepository.softDelete(item.id))
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
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

      <Dialog open={Boolean(editingTransfer)} onOpenChange={(open) => !open && setEditingTransferId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transfer</DialogTitle>
          </DialogHeader>
          {editingTransfer ? (
            <TransferForm
              initialValue={editingTransfer}
              userId={userId}
              submitLabel="Save changes"
              onSubmitted={() => setEditingTransferId(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

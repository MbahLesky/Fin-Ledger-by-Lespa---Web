import { ArrowRightLeft, Pencil, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LedgerHistoryItem } from "@/types";
import { formatCurrency } from "@/utils/formatting";

// Shared by the desktop table and the mobile card list so the two views can never
// drift apart in what they show or what their controls do.

export function EntryTypeBadge({ entryType }: { entryType: LedgerHistoryItem["entryType"] }) {
  if (entryType === "income") {
    return <Badge variant="success">Income</Badge>;
  }

  if (entryType === "expense") {
    return <Badge variant="accent">Expense</Badge>;
  }

  return (
    <Badge variant="default" className="gap-1">
      <ArrowRightLeft className="size-3" />
      Transfer
    </Badge>
  );
}

export function amountToneClass(entryType: LedgerHistoryItem["entryType"]) {
  if (entryType === "income") {
    return "text-secondary";
  }

  return entryType === "expense" ? "text-accent" : "";
}

export function formatSignedAmount(item: LedgerHistoryItem, fallbackCurrencyCode: string) {
  const sign = item.entryType === "income" ? "+" : item.entryType === "expense" ? "-" : "";
  return `${sign}${formatCurrency(item.amount, item.currencyCode || fallbackCurrencyCode)}`;
}

interface HistoryEntryActionsProps {
  item: LedgerHistoryItem;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export function HistoryEntryActions({ item, onEdit, onDelete, className }: HistoryEntryActionsProps) {
  const label = item.kind === "transfer" ? "transfer" : "transaction";

  return (
    <div className={cn("flex gap-2", className)}>
      <Button variant="ghost" size="sm" onClick={onEdit}>
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
            <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This uses a soft delete so the change can sync safely later. The row will disappear from
              your active history immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface HistoryEntryCardProps {
  item: LedgerHistoryItem;
  fallbackCurrencyCode: string;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * The mobile view of one ledger entry. A seven-column table cannot be read on a
 * phone without sideways scrolling, so below `md` each entry becomes a card: the
 * amount and type lead, the rest reads as labelled lines.
 */
export function HistoryEntryCard({
  item,
  fallbackCurrencyCode,
  onEdit,
  onDelete
}: HistoryEntryCardProps) {
  return (
    <article className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <EntryTypeBadge entryType={item.entryType} />
          <p className="text-sm font-medium">{item.categoryLabel ?? "Uncategorized"}</p>
          <p className="text-xs text-muted-foreground">{item.occurredAt.slice(0, 10)}</p>
        </div>
        <div className="text-right">
          <p className={cn("text-base font-semibold", amountToneClass(item.entryType))}>
            {formatSignedAmount(item, fallbackCurrencyCode)}
          </p>
          {item.kind === "transfer" && item.fee > 0 ? (
            <p className="text-xs text-muted-foreground">
              Fee {formatCurrency(item.fee, item.currencyCode || fallbackCurrencyCode)}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 text-muted-foreground">Account</dt>
          <dd className="ml-auto text-right">{item.accountLabel}</dd>
        </div>
        {item.description ? (
          <div className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">Note</dt>
            <dd className="ml-auto break-words text-right text-muted-foreground">{item.description}</dd>
          </div>
        ) : null}
      </dl>

      <HistoryEntryActions
        item={item}
        onEdit={onEdit}
        onDelete={onDelete}
        className="mt-3 justify-end border-t border-border/60 pt-3"
      />
    </article>
  );
}

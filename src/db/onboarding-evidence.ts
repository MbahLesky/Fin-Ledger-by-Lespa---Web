import type { Account, Category } from "@/types";

interface LedgerEvidence {
  transactionCount: number;
  transferCount: number;
  accounts: Pick<Account, "isDefault" | "openingBalance">[];
  categories: Pick<Category, "isDefault">[];
}

/**
 * Whether this workspace already holds a ledger the user built — the evidence
 * that onboarding has been completed before, whatever the settings row says.
 *
 * Every fresh install seeds the same default accounts and categories, so those
 * prove nothing on their own: only a transaction, a transfer, an account the user
 * gave a balance or created, or a category they added counts.
 */
export function hasEvidenceOfExistingLedger({
  transactionCount,
  transferCount,
  accounts,
  categories
}: LedgerEvidence): boolean {
  if (transactionCount > 0 || transferCount > 0) {
    return true;
  }

  if (accounts.some((account) => !account.isDefault || account.openingBalance !== 0)) {
    return true;
  }

  return categories.some((category) => !category.isDefault);
}

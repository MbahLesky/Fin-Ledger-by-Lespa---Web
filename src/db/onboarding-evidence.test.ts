import { describe, expect, it } from "vitest";
import { hasEvidenceOfExistingLedger } from "@/db/onboarding-evidence";
import { createDefaultAccounts, createDefaultCategories } from "@/db/seed/default-records";

const freshInstall = {
  transactionCount: 0,
  transferCount: 0,
  accounts: createDefaultAccounts(),
  categories: createDefaultCategories()
};

describe("hasEvidenceOfExistingLedger", () => {
  it("finds no evidence in a freshly seeded workspace", () => {
    expect(hasEvidenceOfExistingLedger(freshInstall)).toBe(false);
  });

  it("counts a pulled transaction as evidence", () => {
    expect(hasEvidenceOfExistingLedger({ ...freshInstall, transactionCount: 12 })).toBe(true);
  });

  it("counts a pulled transfer as evidence", () => {
    expect(hasEvidenceOfExistingLedger({ ...freshInstall, transferCount: 1 })).toBe(true);
  });

  it("counts an opening balance on a default account as evidence", () => {
    const accounts = createDefaultAccounts();
    accounts[0].openingBalance = 25_000;

    expect(hasEvidenceOfExistingLedger({ ...freshInstall, accounts })).toBe(true);
  });

  it("counts an account the user created as evidence", () => {
    const accounts = [
      ...createDefaultAccounts(),
      { isDefault: false, openingBalance: 0 }
    ];

    expect(hasEvidenceOfExistingLedger({ ...freshInstall, accounts })).toBe(true);
  });

  it("counts a category the user created as evidence", () => {
    const categories = [...createDefaultCategories(), { isDefault: false }];

    expect(hasEvidenceOfExistingLedger({ ...freshInstall, categories })).toBe(true);
  });
});

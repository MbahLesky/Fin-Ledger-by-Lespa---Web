import { describe, expect, it } from "vitest";
import { transferSchema } from "@/features/transfers/transfer-schema";

describe("transferSchema", () => {
  it("accepts a valid transfer payload", () => {
    const result = transferSchema.safeParse({
      fromAccountId: "default-cash",
      toAccountId: "default-bank",
      amount: 1500,
      fee: 25,
      transferDate: "2026-04-09",
      note: "Move to bank"
    });

    expect(result.success).toBe(true);
  });

  it("rejects same source and destination account", () => {
    const result = transferSchema.safeParse({
      fromAccountId: "default-cash",
      toAccountId: "default-cash",
      amount: 500,
      fee: 0,
      transferDate: "2026-04-09",
      note: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("toAccountId"))).toBe(true);
  });

  it("rejects non-positive amount", () => {
    const result = transferSchema.safeParse({
      fromAccountId: "default-cash",
      toAccountId: "default-bank",
      amount: 0,
      fee: 0,
      transferDate: "2026-04-09",
      note: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("amount"))).toBe(true);
  });

  it("rejects negative fee", () => {
    const result = transferSchema.safeParse({
      fromAccountId: "default-cash",
      toAccountId: "default-bank",
      amount: 100,
      fee: -1,
      transferDate: "2026-04-09",
      note: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("fee"))).toBe(true);
  });
});

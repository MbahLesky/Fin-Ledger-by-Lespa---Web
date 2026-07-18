import { describe, expect, it } from "vitest";
import { transferSchema } from "@/features/transfers/transfer-schema";

describe("transferSchema", () => {
  it("accepts a valid transfer payload", () => {
    const result = transferSchema.safeParse({
      fromAccountId: "default-cash",
      toAccountId: "default-bank",
      amount: 1500,
      sourceFee: 25,
      destinationFee: 0,
      transferDate: "2026-04-09",
      description: "Move to bank"
    });

    expect(result.success).toBe(true);
  });

  it("rejects same source and destination account", () => {
    const result = transferSchema.safeParse({
      fromAccountId: "default-cash",
      toAccountId: "default-cash",
      amount: 500,
      sourceFee: 0,
      destinationFee: 0,
      transferDate: "2026-04-09",
      description: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("toAccountId"))).toBe(true);
  });

  it("rejects non-positive amount", () => {
    const result = transferSchema.safeParse({
      fromAccountId: "default-cash",
      toAccountId: "default-bank",
      amount: 0,
      sourceFee: 0,
      destinationFee: 0,
      transferDate: "2026-04-09",
      description: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("amount"))).toBe(true);
  });

  it("rejects negative fees", () => {
    const result = transferSchema.safeParse({
      fromAccountId: "default-cash",
      toAccountId: "default-bank",
      amount: 100,
      sourceFee: -1,
      destinationFee: 0,
      transferDate: "2026-04-09",
      description: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("sourceFee"))).toBe(true);
  });

  it("rejects a destination fee greater than the amount", () => {
    const result = transferSchema.safeParse({
      fromAccountId: "default-cash",
      toAccountId: "default-bank",
      amount: 100,
      sourceFee: 0,
      destinationFee: 150,
      transferDate: "2026-04-09",
      description: ""
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path.includes("destinationFee"))).toBe(true);
  });
});

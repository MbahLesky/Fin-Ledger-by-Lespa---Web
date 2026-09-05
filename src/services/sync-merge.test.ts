import { describe, expect, it } from "vitest";
import { createDefaultAccounts, createDefaultSettings } from "@/db/seed/default-records";
import { shouldApplyRemoteRecord, toIsoTimestamp } from "@/services/sync-merge";

describe("toIsoTimestamp", () => {
  it("passes ISO strings through", () => {
    expect(toIsoTimestamp("2026-07-01T00:00:00.000Z")).toBe("2026-07-01T00:00:00.000Z");
  });

  it("normalises Firestore Timestamps so they compare as dates, not objects", () => {
    const timestamp = { toDate: () => new Date("2026-07-01T00:00:00.000Z") };

    expect(toIsoTimestamp(timestamp)).toBe("2026-07-01T00:00:00.000Z");
  });

  it("treats a missing timestamp as the oldest possible value", () => {
    expect(toIsoTimestamp(undefined)).toBe(new Date(0).toISOString());
  });
});

describe("shouldApplyRemoteRecord", () => {
  it("applies a record this device has never seen", () => {
    expect(shouldApplyRemoteRecord("2026-07-01T00:00:00.000Z", undefined)).toBe(true);
  });

  it("keeps a newer local edit", () => {
    expect(shouldApplyRemoteRecord("2026-07-01T00:00:00.000Z", "2026-07-02T00:00:00.000Z")).toBe(
      false
    );
  });

  it("applies the remote copy on a tie", () => {
    expect(shouldApplyRemoteRecord("2026-07-01T00:00:00.000Z", "2026-07-01T00:00:00.000Z")).toBe(
      true
    );
  });

  // The reported bug: a returning user's real accounts and settings were hidden
  // behind placeholders this device had just seeded, because the placeholders were
  // stamped "now" and so outranked every real record.
  it("lets a real record beat freshly seeded default accounts", () => {
    const [seededAccount] = createDefaultAccounts();

    expect(shouldApplyRemoteRecord("2026-01-01T00:00:00.000Z", seededAccount.updatedAt)).toBe(true);
  });

  it("lets a real record beat freshly seeded settings", () => {
    const seededSettings = createDefaultSettings();

    expect(shouldApplyRemoteRecord("2026-01-01T00:00:00.000Z", seededSettings.updatedAt)).toBe(true);
  });
});

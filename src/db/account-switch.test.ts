import { describe, expect, it } from "vitest";
import { decideAccountSwitch } from "@/db/account-switch";

describe("decideAccountSwitch", () => {
  it("continues when the workspace already belongs to this user", () => {
    expect(
      decideAccountSwitch({ localOwnerId: "user-a", userId: "user-a", unsyncedCount: 3 })
    ).toBe("continue");
  });

  it("continues on a browser nobody has claimed yet", () => {
    expect(decideAccountSwitch({ localOwnerId: null, userId: "user-a", unsyncedCount: 0 })).toBe(
      "continue"
    );
  });

  it("clears another account's fully synced workspace without asking", () => {
    expect(
      decideAccountSwitch({ localOwnerId: "user-b", userId: "user-a", unsyncedCount: 0 })
    ).toBe("clear-previous");
  });

  it("asks before discarding another account's unsynced changes", () => {
    expect(
      decideAccountSwitch({ localOwnerId: "user-b", userId: "user-a", unsyncedCount: 1 })
    ).toBe("ask");
  });
});

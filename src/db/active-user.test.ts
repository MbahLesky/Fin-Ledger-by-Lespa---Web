import { beforeEach, describe, expect, it } from "vitest";
import { belongsToActiveUser, getActiveUserId, setActiveUserId } from "@/db/active-user";

describe("belongsToActiveUser", () => {
  beforeEach(() => {
    setActiveUserId(null);
  });

  it("keeps unowned rows, which are the seeded defaults", () => {
    expect(belongsToActiveUser({ userId: null })).toBe(true);
    expect(belongsToActiveUser({})).toBe(true);
  });

  it("keeps the signed-in user's own rows", () => {
    setActiveUserId("user-a");

    expect(belongsToActiveUser({ userId: "user-a" })).toBe(true);
  });

  it("hides rows left behind by another account", () => {
    setActiveUserId("user-a");

    expect(belongsToActiveUser({ userId: "user-b" })).toBe(false);
  });

  it("hides owned rows while nobody is signed in", () => {
    expect(belongsToActiveUser({ userId: "user-b" })).toBe(false);
  });

  it("reports who reads are scoped to", () => {
    setActiveUserId("user-a");

    expect(getActiveUserId()).toBe("user-a");
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearInviteCode,
  normalizeInviteCode,
  readInviteCodeFromUrl,
  readStoredInviteCode,
  storeInviteCode
} from "@/features/auth/invite-code";

function setUrl(search: string) {
  window.history.replaceState({}, "", `/register${search}`);
}

describe("normalizeInviteCode", () => {
  it("uppercases and trims a code", () => {
    expect(normalizeInviteCode("  leaders ")).toBe("LEADERS");
  });

  it("returns null for blank or missing input", () => {
    expect(normalizeInviteCode("   ")).toBeNull();
    expect(normalizeInviteCode("")).toBeNull();
    expect(normalizeInviteCode(null)).toBeNull();
    expect(normalizeInviteCode(undefined)).toBeNull();
  });
});

describe("invite code session capture", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    setUrl("");
  });

  it("reads a code off the URL and persists it for the session", () => {
    setUrl("?code=leaders");

    expect(readInviteCodeFromUrl()).toBe("LEADERS");
    expect(readStoredInviteCode()).toBe("LEADERS");
  });

  it("falls back to the stored code when the URL has none", () => {
    storeInviteCode("bauhaven");
    setUrl("");

    expect(readInviteCodeFromUrl()).toBe("BAUHAVEN");
  });

  it("prefers the URL code over a stale stored one", () => {
    storeInviteCode("OLD");
    setUrl("?code=NEW");

    expect(readInviteCodeFromUrl()).toBe("NEW");
    expect(readStoredInviteCode()).toBe("NEW");
  });

  it("returns an empty string when no code is available anywhere", () => {
    expect(readInviteCodeFromUrl()).toBe("");
  });

  it("ignores a blank code on the URL rather than storing it", () => {
    storeInviteCode("KEEP");
    setUrl("?code=%20%20");

    expect(readInviteCodeFromUrl()).toBe("KEEP");
  });

  it("clears a consumed code", () => {
    storeInviteCode("LEADERS");
    clearInviteCode();

    expect(readStoredInviteCode()).toBe("");
  });
});

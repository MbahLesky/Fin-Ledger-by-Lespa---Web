import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCheckpoints,
  clearLegacyCheckpoints,
  getCheckpoint,
  setCheckpoint
} from "@/services/sync-checkpoints";

const PREFIX = "monilog-firestore-checkpoint";

describe("sync checkpoints", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps each account's cursor separate", () => {
    setCheckpoint("transactions", "user-a", "2026-07-01T00:00:00.000Z");

    expect(getCheckpoint("transactions", "user-a")).toBe("2026-07-01T00:00:00.000Z");
    // Without this, the second account to sign in on a shared browser inherits
    // the first one's cursor and never pulls its own history.
    expect(getCheckpoint("transactions", "user-b")).toBeNull();
  });

  it("keeps each entity's cursor separate", () => {
    setCheckpoint("transactions", "user-a", "2026-07-01T00:00:00.000Z");

    expect(getCheckpoint("accounts", "user-a")).toBeNull();
  });

  it("clears only the named account's cursors", () => {
    setCheckpoint("transactions", "user-a", "2026-07-01T00:00:00.000Z");
    setCheckpoint("accounts", "user-a", "2026-07-01T00:00:00.000Z");
    setCheckpoint("transactions", "user-b", "2026-07-02T00:00:00.000Z");

    clearCheckpoints("user-a");

    expect(getCheckpoint("transactions", "user-a")).toBeNull();
    expect(getCheckpoint("accounts", "user-a")).toBeNull();
    expect(getCheckpoint("transactions", "user-b")).toBe("2026-07-02T00:00:00.000Z");
  });

  it("clears every cursor when no account is named", () => {
    setCheckpoint("transactions", "user-a", "2026-07-01T00:00:00.000Z");
    setCheckpoint("transactions", "user-b", "2026-07-02T00:00:00.000Z");
    window.localStorage.setItem("unrelated-key", "kept");

    clearCheckpoints();

    expect(getCheckpoint("transactions", "user-a")).toBeNull();
    expect(getCheckpoint("transactions", "user-b")).toBeNull();
    expect(window.localStorage.getItem("unrelated-key")).toBe("kept");
  });

  it("drops unscoped cursors written before checkpoints carried a uid", () => {
    window.localStorage.setItem(`${PREFIX}:transactions`, "2026-07-01T00:00:00.000Z");
    setCheckpoint("transactions", "user-a", "2026-07-02T00:00:00.000Z");

    clearLegacyCheckpoints();

    expect(window.localStorage.getItem(`${PREFIX}:transactions`)).toBeNull();
    expect(getCheckpoint("transactions", "user-a")).toBe("2026-07-02T00:00:00.000Z");
  });
});

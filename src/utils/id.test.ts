import { afterEach, describe, expect, it } from "vitest";
import { createId } from "@/utils/id";

const originalCrypto = globalThis.crypto;

afterEach(() => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: originalCrypto
  });
});

describe("createId", () => {
  it("creates prefixed ids", () => {
    const id = createId("txn");
    expect(id.startsWith("txn_")).toBe(true);
  });

  it("falls back to getRandomValues when randomUUID is unavailable", () => {
    const mockCrypto = {
      getRandomValues(buffer: Uint8Array) {
        for (let index = 0; index < buffer.length; index += 1) {
          buffer[index] = index;
        }

        return buffer;
      }
    };

    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: mockCrypto
    });

    const id = createId("sync");
    expect(id).toBe("sync_00010203-0405-4607-8809-0a0b0c0d0e0f");
  });

  it("falls back when crypto is unavailable", () => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: undefined
    });

    const first = createId("account");
    const second = createId("account");

    expect(first.startsWith("account_")).toBe(true);
    expect(second.startsWith("account_")).toBe(true);
    expect(first).not.toBe(second);
    expect(first).toMatch(/^account_[0-9a-f-]{36}$/);
    expect(second).toMatch(/^account_[0-9a-f-]{36}$/);
  });
});

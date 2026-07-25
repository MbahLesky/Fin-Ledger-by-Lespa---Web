// Shared with the landing page (Landing Page/context/AuthContext.jsx), so a code
// captured there survives a hand-off to the app on the same browser.
const INVITE_CODE_STORAGE_KEY = "monilog:betaCode";

const INVITE_CODE_QUERY_PARAM = "code";

/** Uppercases and trims a code, returning null for blank input. */
export function normalizeInviteCode(code: string | null | undefined): string | null {
  const trimmed = typeof code === "string" ? code.trim() : "";
  return trimmed ? trimmed.toUpperCase() : null;
}

/**
 * Resolves an invite code carried in on the URL (e.g. /register?code=LEADERS),
 * falling back to one captured earlier in the session. A code found on the URL is
 * persisted so it survives reloads and the Google sign-in popup.
 */
export function readInviteCodeFromUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const fromUrl = normalizeInviteCode(
    new URLSearchParams(window.location.search).get(INVITE_CODE_QUERY_PARAM)
  );

  if (fromUrl) {
    storeInviteCode(fromUrl);
    return fromUrl;
  }

  return readStoredInviteCode();
}

export function readStoredInviteCode(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return normalizeInviteCode(window.sessionStorage.getItem(INVITE_CODE_STORAGE_KEY)) ?? "";
  } catch {
    // Private-mode browsers can throw on sessionStorage access; a missing code
    // just means the tester types it in.
    return "";
  }
}

export function storeInviteCode(code: string): void {
  const normalized = normalizeInviteCode(code);
  if (typeof window === "undefined" || !normalized) {
    return;
  }

  try {
    window.sessionStorage.setItem(INVITE_CODE_STORAGE_KEY, normalized);
  } catch {
    // Non-fatal: the code stays in component state for this page view.
  }
}

export function clearInviteCode(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(INVITE_CODE_STORAGE_KEY);
  } catch {
    // Non-fatal.
  }
}

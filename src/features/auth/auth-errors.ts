// Maps Firebase Auth error codes to friendly, user-facing messages. Mirrors the
// landing page's lib/authErrors.js so both surfaces speak the same language.

const messages: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists. Try logging in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/missing-email": "Please enter your email address.",
  "auth/weak-password": "Password is too weak. Use at least 8 characters.",
  "auth/invalid-credential": "Incorrect email or password. Please try again.",
  "auth/wrong-password": "Incorrect email or password. Please try again.",
  "auth/user-not-found": "No account found with this email. Create one to get started.",
  "auth/user-disabled": "This account has been disabled. Contact support for help.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Please allow popups and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
  "auth/not-initialized": "Sign-in is not available right now. Please try again later."
};

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

function errorCodeOf(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const { code } = error as { code?: unknown };
    return typeof code === "string" ? code : null;
  }

  return null;
}

export function mapAuthError(error: unknown): string {
  const code = errorCodeOf(error);
  if (code && messages[code]) {
    return messages[code];
  }

  // Errors we raised ourselves (e.g. missing Firebase config) already carry a
  // readable message; only opaque Firebase codes need the fallback.
  if (!code && error instanceof Error && error.message) {
    return error.message;
  }

  return FALLBACK_MESSAGE;
}

// Wraps a Firebase Auth call so every failure surfaces as a friendly Error.
export async function withMappedAuthError<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

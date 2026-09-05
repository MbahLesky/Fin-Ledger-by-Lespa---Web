import type { User } from "firebase/auth";
import { toast } from "sonner";
import { create } from "zustand";
import { mapAuthError } from "@/features/auth/auth-errors";
import { clearInviteCode, readStoredInviteCode } from "@/features/auth/invite-code";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { isFirebaseConfigured } from "@/lib/env";
import { betaTesterService } from "@/services/beta-tester-service";
import { identifyUser, trackEvent } from "@/services/firebase-analytics-service";
import { firebaseAuthService } from "@/services/firebase-auth-service";
import { useSyncStore } from "@/store/sync-store";
import type { Profile, TesterRegistrationResult } from "@/types";
import { decideAccountSwitch } from "@/db/account-switch";
import { syncRepository } from "@/db/repositories/sync-repository";
import { workspaceRepository } from "@/db/repositories/workspace-repository";
import { nowIso } from "@/utils/date-utils";

type AuthStatus = "checking" | "signed_out" | "signed_in";

/**
 * Raised when this browser still holds another account's workspace and that
 * workspace has changes the cloud has never seen. Nothing of theirs is shown or
 * uploaded until someone decides what happens to it.
 */
interface AccountSwitchPrompt {
  previousUserId: string;
  unsyncedCount: number;
}

interface AuthState {
  status: AuthStatus;
  authAvailable: boolean;
  user: User | null;
  profile: Profile | null;
  error: string | null;
  notice: string | null;
  accountSwitch: AccountSwitchPrompt | null;
  bootstrap: () => Promise<void>;
  hydrateFromUser: (user: User | null) => Promise<void>;
  syncWorkspace: (userId: string) => Promise<boolean>;
  discardPreviousWorkspace: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    fullName: string,
    email: string,
    password: string,
    inviteCode?: string
  ) => Promise<void>;
  signInWithGoogle: (inviteCode?: string) => Promise<void>;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (updates: Partial<Profile>) => Promise<void>;
  clearMessages: () => void;
}

// Thrown when a supplied invite code is unknown or switched off. Carries the
// rollback outcome so the form can tell the tester whether to retry or log in.
export class InviteCodeError extends Error {
  readonly accountRemoved: boolean;

  constructor(message: string, accountRemoved: boolean) {
    super(message);
    this.name = "InviteCodeError";
    this.accountRemoved = accountRemoved;
  }
}

const INVALID_CODE_MESSAGE =
  "That access code isn't valid. Check it, or leave it blank to join as a general tester.";

const ROSTER_UNAVAILABLE_MESSAGE =
  "We couldn't confirm your beta access just now. Please try again in a moment.";

// How long sign-in waits for the first sync before showing the app anyway. The
// pull keeps running in the background; this only bounds the restore screen.
const SIGN_IN_SYNC_TIMEOUT_MS = 15_000;

/**
 * Claims a beta-tester place for a freshly authenticated user. A rejected code
 * rolls the brand-new account back so the tester can retry with the same email
 * instead of hitting "email already in use"; an account that existed before this
 * sign-in is never deleted.
 *
 * Already-registered users pass straight through, mirroring the landing page's
 * `already_registered` outcome — a returning tester must never be re-gated by a
 * stale code left in session storage.
 */
async function claimTesterPlace(user: User, inviteCode: string): Promise<TesterRegistrationResult> {
  try {
    const existing = await betaTesterService.getTester(user.uid);
    if (existing) {
      clearInviteCode();
      return { status: "registered", code: null };
    }
  } catch (lookupError) {
    // An unreadable roster must not strand someone who is already a tester, so
    // fall through and let the write below decide.
    console.error("Tester lookup failed:", lookupError);
  }

  const result = await betaTesterService.registerTester(user.uid, {
    name: user.displayName ?? "",
    email: user.email ?? "",
    code: inviteCode
  });

  if (result.status === "registered") {
    if (result.code) {
      trackEvent(ANALYTICS_EVENTS.betaCodeUsed, {
        code: result.code.code,
        organisation: result.code.organisation_name ?? undefined
      });
    }

    // The code has been consumed; drop it so a later sign-in on this browser
    // does not silently reapply it.
    clearInviteCode();
    return result;
  }

  const accountRemoved = await firebaseAuthService.deleteJustCreatedUser();
  if (!accountRemoved) {
    await firebaseAuthService.signOut();
  }

  trackEvent(ANALYTICS_EVENTS.betaCodeRejected, {
    reason: result.status,
    account_removed: accountRemoved
  });

  if (result.status === "invalid_code") {
    throw new InviteCodeError(INVALID_CODE_MESSAGE, accountRemoved);
  }

  throw new InviteCodeError(ROSTER_UNAVAILABLE_MESSAGE, accountRemoved);
}

function profileFromUser(user: User): Profile {
  return {
    id: user.uid,
    name: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    avatarUrl: user.photoURL,
    onboardingCompleted: false,
    preferredCurrency: null,
    createdAt: user.metadata.creationTime ?? nowIso(),
    updatedAt: user.metadata.lastSignInTime ?? nowIso()
  };
}

function isProfileComplete(profile: Profile | null) {
  return Boolean(profile?.name?.trim());
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "checking",
  authAvailable: isFirebaseConfigured,
  user: null,
  profile: null,
  error: null,
  notice: null,
  accountSwitch: null,

  bootstrap: async () => {
    await workspaceRepository.initialize();

    if (!isFirebaseConfigured) {
      set({
        status: "signed_out",
        authAvailable: false,
        user: null,
        profile: null,
        error: null
      });
      return;
    }

    // The initial auth state (persisted session) is delivered via
    // firebaseAuthService.onAuthStateChange, wired up in AppBootstrap.
  },

  hydrateFromUser: async (user) => {
    if (!user) {
      set({
        status: "signed_out",
        user: null,
        profile: null
      });
      return;
    }

    // Only the opaque uid — never email or display name — so analytics holds no
    // directly identifying data.
    identifyUser(user.uid);

    try {
      // Bounded, and never fatal: a sync that fails or stalls must not strand the
      // user on "Restoring your session..." — the ledger is local-first, and a
      // pull that lands late still reaches the screen through Dexie's live
      // queries.
      await Promise.race([
        get().syncWorkspace(user.uid),
        new Promise((resolve) => window.setTimeout(resolve, SIGN_IN_SYNC_TIMEOUT_MS))
      ]);
    } catch (syncError) {
      console.error("Workspace sync failed while restoring the session:", syncError);
    } finally {
      set({
        status: "signed_in",
        user,
        profile: profileFromUser(user),
        error: null
      });
    }
  },

  /**
   * Reconciles this browser's local workspace with the signed-in account.
   *
   * Order matters: release any stale ownership *before* pulling, so the pull can
   * populate this account's real state onto a clean row instead of one still
   * stamped (and freshly timestamped) for a previous local user or a just-seeded
   * placeholder. Claim ownership only *after* a pull that actually succeeded — a
   * returning user's data is then already correct and left untouched, and a
   * failed pull can never push placeholder rows over their real remote records.
   */
  syncWorkspace: async (userId) => {
    if (!isFirebaseConfigured || !navigator.onLine) {
      await useSyncStore.getState().refresh();
      return false;
    }

    // A browser is shared: whatever is on this device belongs to whoever signed in
    // last. Their ledger must never be shown to, or uploaded for, the person
    // signing in now — so it is cleared before the pull. When it still holds
    // changes the cloud has never seen, clearing would destroy them, so the app
    // stops and asks instead.
    const localOwnerId = await workspaceRepository.getLocalOwnerId();
    const unsyncedCount = await syncRepository.countUnsynced();
    const decision = decideAccountSwitch({ localOwnerId, userId, unsyncedCount });

    if (decision === "ask" && localOwnerId) {
      set({ accountSwitch: { previousUserId: localOwnerId, unsyncedCount } });
      return false;
    }

    if (decision === "clear-previous" && localOwnerId) {
      await workspaceRepository.clearWorkspaceData(localOwnerId);
    }

    await workspaceRepository.releaseStaleOwnership(userId);

    const pulled = await useSyncStore.getState().runNow(userId);
    if (!pulled) {
      return false;
    }

    await workspaceRepository.reconcileOnboardingState();
    await workspaceRepository.stampOwnership(userId);
    return true;
  },

  /**
   * Throws away the previous account's unsynced workspace and continues signing
   * the current user in. Only ever reached from the account-switch screen, where
   * the person has been told exactly how many changes are being discarded.
   */
  discardPreviousWorkspace: async () => {
    const { accountSwitch, user } = get();
    if (!accountSwitch) {
      return;
    }

    await workspaceRepository.clearWorkspaceData(accountSwitch.previousUserId);
    set({ accountSwitch: null });

    if (user) {
      await get().syncWorkspace(user.uid);
    }
  },

  signIn: async (email, password) => {
    set({ error: null, notice: null });
    const user = await firebaseAuthService.signIn(email, password);
    trackEvent(ANALYTICS_EVENTS.loginCompleted, { method: "email_password" });
    await get().hydrateFromUser(user);
  },

  signUp: async (fullName, email, password, inviteCode = "") => {
    set({ error: null, notice: null });
    trackEvent(ANALYTICS_EVENTS.signUpStarted, {
      method: "email_password",
      has_invite_code: Boolean(inviteCode.trim())
    });
    const user = await firebaseAuthService.signUp({ fullName, email, password });

    // Beta access is settled before anything else: claimTesterPlace rolls the new
    // account back if the code is rejected, so nothing is left half-created.
    const registration = await claimTesterPlace(user, inviteCode);

    // Sent before hydrating, because hydration navigates straight into
    // onboarding — the toast outlives the auth screen, the notice would not.
    const verificationSent = await firebaseAuthService.sendVerificationEmail();
    if (verificationSent) {
      toast.success("Account created", {
        description: `We sent a verification link to ${user.email ?? email}.`
      });
    }

    const organisation = registration.code?.organisation_name;
    if (organisation) {
      toast.success("Access code accepted", {
        description: `You've joined the beta through ${organisation}.`
      });
    }

    trackEvent(ANALYTICS_EVENTS.signUpCompleted, {
      method: "email_password",
      has_invite_code: Boolean(registration.code)
    });

    await get().hydrateFromUser(user);
  },

  signInWithGoogle: async (inviteCode = "") => {
    set({ error: null, notice: null });
    const user = await firebaseAuthService.signInWithGoogle();
    trackEvent(ANALYTICS_EVENTS.googleSignIn, { method: "popup" });
    await claimTesterPlace(user, inviteCode);
    await get().hydrateFromUser(user);
  },

  // Google One Tap resolves outside any form, so failures surface through the
  // store's own error slot rather than being thrown at a caller. There is no code
  // field on a One Tap prompt, so it can only use a code carried in on the URL.
  signInWithGoogleCredential: async (idToken) => {
    set({ error: null, notice: null });
    try {
      const user = await firebaseAuthService.signInWithGoogleCredential(idToken);
      trackEvent(ANALYTICS_EVENTS.googleSignIn, { method: "one_tap" });
      await claimTesterPlace(user, readStoredInviteCode());
      await get().hydrateFromUser(user);
    } catch (error) {
      set({ error: mapAuthError(error) });
    }
  },

  resetPassword: async (email) => {
    set({ error: null, notice: null });
    await firebaseAuthService.sendPasswordReset(email);
    trackEvent(ANALYTICS_EVENTS.passwordResetRequested);
    set({ notice: "Password reset email sent. Check your inbox." });
  },

  signOut: async () => {
    if (isFirebaseConfigured) {
      await firebaseAuthService.signOut();
    }

    // Leaving the ledger behind is what let the next person to sign in on this
    // browser see it. It is only safe to clear once the cloud has everything:
    // anything still queued stays, and is settled at the next sign-in.
    const unsyncedCount = await syncRepository.countUnsynced();
    if (unsyncedCount === 0) {
      await workspaceRepository.clearWorkspaceData(get().user?.uid);
    }

    trackEvent(ANALYTICS_EVENTS.signOut);
    identifyUser(null);

    // Without this, One Tap's auto-select would silently sign the user back in
    // the moment they land back on the login screen.
    window.google?.accounts?.id?.disableAutoSelect();

    set({
      status: "signed_out",
      user: null,
      profile: null,
      error: null,
      notice: null,
      accountSwitch: null
    });
  },

  saveProfile: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error("You need an active session first.");
    }

    if (typeof updates.name === "string" && updates.name.trim()) {
      await firebaseAuthService.updateDisplayName(updates.name.trim());
    }

    set({
      profile: {
        ...profileFromUser(currentUser),
        ...get().profile,
        ...updates,
        updatedAt: nowIso()
      }
    });
  },

  clearMessages: () => set({ error: null, notice: null })
}));

export { isProfileComplete };

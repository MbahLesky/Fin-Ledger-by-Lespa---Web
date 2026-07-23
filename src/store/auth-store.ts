import type { User } from "firebase/auth";
import { toast } from "sonner";
import { create } from "zustand";
import { mapAuthError } from "@/features/auth/auth-errors";
import { isFirebaseConfigured } from "@/lib/env";
import { firebaseAuthService } from "@/services/firebase-auth-service";
import { useSyncStore } from "@/store/sync-store";
import type { Profile } from "@/types";
import { workspaceRepository } from "@/db/repositories/workspace-repository";
import { nowIso } from "@/utils/date-utils";

type AuthStatus = "checking" | "signed_out" | "signed_in";

interface AuthState {
  status: AuthStatus;
  authAvailable: boolean;
  user: User | null;
  profile: Profile | null;
  error: string | null;
  notice: string | null;
  bootstrap: () => Promise<void>;
  hydrateFromUser: (user: User | null) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (updates: Partial<Profile>) => Promise<void>;
  clearMessages: () => void;
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

    await workspaceRepository.stampOwnership(user.uid);

    set({
      status: "signed_in",
      user,
      profile: profileFromUser(user),
      error: null
    });

    await useSyncStore.getState().runNow(user.uid);
  },

  signIn: async (email, password) => {
    set({ error: null, notice: null });
    const user = await firebaseAuthService.signIn(email, password);
    await get().hydrateFromUser(user);
  },

  signUp: async (fullName, email, password) => {
    set({ error: null, notice: null });
    const user = await firebaseAuthService.signUp({ fullName, email, password });

    // Sent before hydrating, because hydration navigates straight into
    // onboarding — the toast outlives the auth screen, the notice would not.
    const verificationSent = await firebaseAuthService.sendVerificationEmail();
    if (verificationSent) {
      toast.success("Account created", {
        description: `We sent a verification link to ${user.email ?? email}.`
      });
    }

    await get().hydrateFromUser(user);
  },

  signInWithGoogle: async () => {
    set({ error: null, notice: null });
    const user = await firebaseAuthService.signInWithGoogle();
    await get().hydrateFromUser(user);
  },

  // Google One Tap resolves outside any form, so failures surface through the
  // store's own error slot rather than being thrown at a caller.
  signInWithGoogleCredential: async (idToken) => {
    set({ error: null, notice: null });
    try {
      const user = await firebaseAuthService.signInWithGoogleCredential(idToken);
      await get().hydrateFromUser(user);
    } catch (error) {
      set({ error: mapAuthError(error) });
    }
  },

  resetPassword: async (email) => {
    set({ error: null, notice: null });
    await firebaseAuthService.sendPasswordReset(email);
    set({ notice: "Password reset email sent. Check your inbox." });
  },

  signOut: async () => {
    if (isFirebaseConfigured) {
      await firebaseAuthService.signOut();
    }

    // Without this, One Tap's auto-select would silently sign the user back in
    // the moment they land back on the login screen.
    window.google?.accounts?.id?.disableAutoSelect();

    set({
      status: "signed_out",
      user: null,
      profile: null,
      error: null,
      notice: null
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

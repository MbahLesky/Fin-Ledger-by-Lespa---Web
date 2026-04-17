import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { isSupabaseConfigured } from "@/lib/env";
import { profileService } from "@/services/profile-service";
import { supabaseAuthService } from "@/services/supabase-auth-service";
import { useRealtimeStore } from "@/store/realtime-store";
import type { Profile } from "@/types";
import { workspaceRepository } from "@/db/repositories/workspace-repository";

type AuthStatus = "checking" | "signed_out" | "signed_in";

interface AuthState {
  status: AuthStatus;
  authAvailable: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  error: string | null;
  notice: string | null;
  bootstrap: () => Promise<void>;
  hydrateFromSession: (session: Session | null) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearMessages: () => void;
}

function isProfileComplete(profile: Profile | null) {
  return Boolean(profile?.name?.trim());
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "checking",
  authAvailable: isSupabaseConfigured,
  session: null,
  user: null,
  profile: null,
  error: null,
  notice: null,

  bootstrap: async () => {
    if (!isSupabaseConfigured) {
      set({
        status: "signed_out",
        authAvailable: false,
        session: null,
        user: null,
        profile: null,
        error: null
      });
      return;
    }

    try {
      const session = await supabaseAuthService.getSession();
      await get().hydrateFromSession(session);
    } catch (error) {
      set({
        status: "signed_out",
        error: error instanceof Error ? error.message : "Unable to restore the session."
      });
    }
  },

  hydrateFromSession: async (session) => {
    if (!session?.user) {
      set({
        status: "signed_out",
        session: null,
        user: null,
        profile: null
      });
      return;
    }

    const profile = await profileService.ensureProfile(session.user);
    await workspaceRepository.initializeForUser(session.user.id);

    set({
      status: "signed_in",
      session,
      user: session.user,
      profile,
      error: null
    });
  },

  signIn: async (email, password) => {
    set({ error: null, notice: null });
    const result = await supabaseAuthService.signIn(email, password);
    await get().hydrateFromSession(result.session);
  },

  signUp: async (fullName, email, password) => {
    set({ error: null, notice: null });
    const result = await supabaseAuthService.signUp({ fullName, email, password });

    if (result.session) {
      await get().hydrateFromSession(result.session);
      return;
    }

    set({
      status: "signed_out",
      notice: "Account created. Check your email if confirmation is required before signing in."
    });
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabaseAuthService.signOut();
    }

    set({
      status: "signed_out",
      session: null,
      user: null,
      profile: null,
      error: null,
      notice: null
    });
    useRealtimeStore.getState().reset();
  },

  saveProfile: async (updates) => {
    const currentProfile = get().profile;
    const currentUser = get().user;
    if (!currentUser) {
      throw new Error("You need an active session first.");
    }

    const nextProfile = await profileService.updateProfile(currentUser.id, {
      ...currentProfile,
      ...updates
    });

    set({
      profile: nextProfile
    });
    useRealtimeStore.getState().markLocalMutation("profiles");
  },

  refreshProfile: async () => {
    const currentUser = get().user;
    if (!currentUser) {
      return;
    }

    const profile = await profileService.getProfile(currentUser.id);
    set({ profile });
  },

  clearMessages: () => set({ error: null, notice: null })
}));

export { isProfileComplete };

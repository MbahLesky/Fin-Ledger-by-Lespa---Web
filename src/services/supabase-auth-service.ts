import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

function assertSupabase() {
  if (!supabase) {
    throw new Error(
      "Authentication is unavailable until a valid Supabase project URL and publishable key are configured."
    );
  }

  return supabase;
}

export const supabaseAuthService = {
  async getSession() {
    const client = assertSupabase();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    return data.session;
  },

  async signIn(email: string, password: string) {
    const client = assertSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async signUp(input: { fullName: string; email: string; password: string }) {
    const client = assertSupabase();
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async signOut() {
    const client = assertSupabase();
    const { error } = await client.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const client = assertSupabase();
    return client.auth.onAuthStateChange(callback);
  }
};


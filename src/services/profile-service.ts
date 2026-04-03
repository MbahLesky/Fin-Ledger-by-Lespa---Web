import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import type { Profile } from "@/types";

function assertSupabase() {
  if (!supabase) {
    throw new Error(
      "Authentication is unavailable until a valid Supabase project URL and publishable key are configured."
    );
  }

  return supabase;
}

function fromProfileRow(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    name: (row.name as string | null | undefined) ?? null,
    email: (row.email as string | null | undefined) ?? null,
    phoneNumber: (row.phone_number as string | null | undefined) ?? null,
    avatarUrl: (row.avatar_url as string | null | undefined) ?? null,
    onboardingCompleted: Boolean(row.onboarding_completed),
    preferredCurrency: (row.preferred_currency as string | null | undefined) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

export const profileService = {
  async getProfile(userId: string) {
    const client = assertSupabase();
    const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();

    if (error) {
      throw new Error(error.message);
    }

    return fromProfileRow(data);
  },

  async ensureProfile(user: User) {
    const client = assertSupabase();
    const payload = {
      id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return fromProfileRow(data);
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const client = assertSupabase();
    const payload = {
      id: userId,
      name: updates.name ?? null,
      email: updates.email ?? null,
      phone_number: updates.phoneNumber ?? null,
      avatar_url: updates.avatarUrl ?? null,
      onboarding_completed: updates.onboardingCompleted ?? false,
      preferred_currency: updates.preferredCurrency ?? null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return fromProfileRow(data);
  }
};


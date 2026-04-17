import { supabase } from "@/lib/supabase-client";

export function assertSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Shared ledger data is unavailable until a valid Supabase project URL and publishable key are configured."
    );
  }

  return supabase;
}

export async function getAuthenticatedUserId() {
  const client = assertSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session?.user) {
    throw new Error("Sign in before accessing shared ledger data.");
  }

  return data.session.user.id;
}

export async function getOptionalAuthenticatedUserId() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.user) {
    return null;
  }

  return data.session.user.id;
}

export function assertOnlineForSharedWrite() {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("You are offline. Shared ledger changes need a connection in this web phase.");
  }
}

export function readString(row: Record<string, unknown>, key: string, fallback = "") {
  const value = row[key];
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  return fallback;
}

export function readNullableString(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  return null;
}

export function readNumber(row: Record<string, unknown>, key: string, fallback = 0) {
  const value = row[key];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readBoolean(row: Record<string, unknown>, key: string, fallback = false) {
  const value = row[key];
  return typeof value === "boolean" ? value : fallback;
}

export function nowTimestamp() {
  return new Date().toISOString();
}

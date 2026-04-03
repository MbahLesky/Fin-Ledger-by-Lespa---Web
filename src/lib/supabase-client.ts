import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

export const supabase = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;


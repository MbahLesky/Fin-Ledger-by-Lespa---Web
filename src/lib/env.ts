const rawEnv = import.meta.env;

export const env = {
  supabaseUrl: rawEnv.VITE_SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: rawEnv.VITE_SUPABASE_ANON_KEY?.trim() ?? "",
  appEnv: rawEnv.VITE_APP_ENV?.trim() ?? "development",
  enablePwa: rawEnv.VITE_ENABLE_PWA !== "false"
};

export const isSupabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;


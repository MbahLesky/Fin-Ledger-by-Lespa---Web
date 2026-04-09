const rawEnv = import.meta.env;

export const env = {
  supabaseUrl: "https://tzdmojpwlycvklrbilyo.supabase.co".trim(),
  supabaseAnonKey: "sb_publishable_U21m4vBFURxNTel8CJ7WPg_YJ0Xk2Lx".trim(),
  appEnv: rawEnv.VITE_APP_ENV?.trim() ?? "development",
  enablePwa: rawEnv.VITE_ENABLE_PWA !== "false"
};

export const isSupabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;


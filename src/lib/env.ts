function readEnvString(key: string) {
  const rawEnv: Record<string, unknown> = import.meta.env;
  const value = rawEnv[key];
  return typeof value === "string" ? value.trim() : undefined;
}

export const env = {
  supabaseUrl: "https://tzdmojpwlycvklrbilyo.supabase.co".trim(),
  supabaseAnonKey: "sb_publishable_U21m4vBFURxNTel8CJ7WPg_YJ0Xk2Lx".trim(),
  appEnv: readEnvString("VITE_APP_ENV") ?? "development",
  enablePwa: readEnvString("VITE_ENABLE_PWA") !== "false"
};

export const isSupabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;

import { useEffect, type ReactNode } from "react";
import { settingsRepository } from "@/db/repositories/settings-repository";
import { useRealtimeStore } from "@/store/realtime-store";
import { useUiStore } from "@/store/ui-store";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);
  const revision = useRealtimeStore((state) => state.revision);

  useEffect(() => {
    void settingsRepository.getSettings().then((settings) => {
      setThemeMode(settings.themeMode);
    });
  }, [revision, setThemeMode]);

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      themeMode === "dark" ||
      (themeMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.toggle("dark", isDark);
  }, [themeMode]);

  return children;
}

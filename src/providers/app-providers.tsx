import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AppBootstrap } from "@/providers/app-bootstrap";
import { ThemeProvider } from "@/providers/theme-provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AppBootstrap />
      {children}
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          className: "font-sans"
        }}
      />
    </ThemeProvider>
  );
}


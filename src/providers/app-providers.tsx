import type { ReactNode } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
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
      {/* Vercel Web Analytics. Inert outside a Vercel deployment, so local dev and
          self-hosted builds are unaffected. */}
      <VercelAnalytics />
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


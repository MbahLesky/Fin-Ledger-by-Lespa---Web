import type { ReactNode } from "react";
import { WalletCards } from "lucide-react";
import { BrandLogo } from "@/components/navigation/brand-logo";
import { Card, CardContent } from "@/components/ui/card";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthLayout({ eyebrow, title, description, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-soft-grid">
      <div className="container flex min-h-screen items-center py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="hidden space-y-8 lg:block">
            <BrandLogo />
            <div className="max-w-xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">{eyebrow}</p>
              <h1 className="text-5xl font-bold leading-tight">
                Make sense of every balance shift without losing your calm.
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                Fin Tracker is designed for clear capture, shared Supabase-backed data, and a
                polished money workflow across web and mobile.
              </p>
            </div>
            <div className="grid max-w-xl gap-4 sm:grid-cols-2">
              <Card className="bg-card/80">
                <CardContent className="space-y-3 p-5">
                  <WalletCards className="size-5 text-primary" />
                  <h2 className="text-lg font-semibold">Shared by design</h2>
                  <p className="text-sm text-muted-foreground">
                    Core ledger actions write to Supabase directly so the same account sees the same records.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/80">
                <CardContent className="space-y-3 p-5">
                  <WalletCards className="size-5 text-secondary" />
                  <h2 className="text-lg font-semibold">Clean personal finance UX</h2>
                  <p className="text-sm text-muted-foreground">
                    Thoughtful spacing, clear copy, and branded surfaces keep the product calm instead of noisy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-xl border-border/60 bg-card/92">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">{eyebrow}</p>
                <h2 className="text-3xl font-bold">{title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

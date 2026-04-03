import { Download, LayoutDashboard, LineChart, Plus, ReceiptText, Settings2 } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/navigation/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes/route-constants";

const navigationItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: ROUTES.dashboard
  },
  {
    label: "Transactions",
    icon: ReceiptText,
    to: ROUTES.transactions
  },
  {
    label: "Analytics",
    icon: LineChart,
    to: ROUTES.analytics
  },
  {
    label: "Settings",
    icon: Settings2,
    to: ROUTES.settings
  }
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-80 shrink-0 border-r border-border/70 bg-card/75 px-6 py-6 backdrop-blur lg:flex lg:flex-col">
          <BrandLogo />
          <div className="mt-8 rounded-2xl bg-brand-gradient p-5 text-primary-foreground shadow-card">
            <p className="text-sm font-medium text-primary-foreground/78">Fast capture</p>
            <h2 className="mt-2 text-2xl font-bold">Track what changed, even offline.</h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/84">
              Local-first entries keep your ledger useful in weak connectivity and ready to sync later.
            </p>
          </div>
          <nav className="mt-8 grid gap-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto grid gap-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate(ROUTES.addTransaction, { state: { backgroundLocation: location } })}
            >
              <Plus className="size-4" />
              Add transaction
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(ROUTES.exportData)}
            >
              <Download className="size-4" />
              Export data
            </Button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
            <div className="container flex h-20 items-center justify-between gap-4">
              <BrandLogo compact />
              <div className="hidden items-center gap-3 sm:flex">
                <Button
                  variant="outline"
                  onClick={() => navigate(ROUTES.importData)}
                >
                  Import
                </Button>
                <Button
                  onClick={() => navigate(ROUTES.addTransaction, { state: { backgroundLocation: location } })}
                >
                  <Plus className="size-4" />
                  Add transaction
                </Button>
              </div>
            </div>
          </header>

          <div className="container py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-border/80 bg-card/95 p-2 shadow-card backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

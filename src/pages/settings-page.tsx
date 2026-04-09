import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/layout/page-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { accountsRepository } from "@/db/repositories/accounts-repository";
import { categoriesRepository } from "@/db/repositories/categories-repository";
import { settingsRepository } from "@/db/repositories/settings-repository";
import { workspaceRepository } from "@/db/repositories/workspace-repository";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { ROUTES } from "@/routes/route-constants";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import type { AccountType, TransactionType } from "@/types";

export function SettingsPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const saveProfile = useAuthStore((state) => state.saveProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const settings = useLiveQuery(() => settingsRepository.getSettings(), []);
  const reminderPreferences = useLiveQuery(() => settingsRepository.getNotificationPreferences(), []);
  const accounts = useLiveQuery(() => accountsRepository.listActive(), []);
  const categories = useLiveQuery(() => categoriesRepository.listActive(), []);
  const setThemeMode = useUiStore((state) => state.setThemeMode);

  const [accountBalances, setAccountBalances] = useState<Record<string, string>>({});
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>("other");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>("expense");

  useEffect(() => {
    if (!accounts) {
      return;
    }

    setAccountBalances(
      Object.fromEntries(accounts.map((account) => [account.id, account.initialBalance.toString()]))
    );
  }, [accounts]);

  async function handleCurrencyChange(currencyCode: string) {
    await settingsRepository.setCurrency(currencyCode);
    await accountsRepository.syncDefaultAccountCurrency(currencyCode);
    await saveProfile({
      preferredCurrency: currencyCode
    });
    toast.success("Currency updated.");
  }

  async function handleThemeChange(themeMode: "light" | "dark" | "system") {
    await settingsRepository.setThemeMode(themeMode);
    setThemeMode(themeMode);
    toast.success("Theme preference saved.");
  }

  async function handleSaveBalances() {
    await accountsRepository.saveOpeningBalances(
      Object.entries(accountBalances).map(([id, balance]) => ({
        id,
        balance: Number(balance || 0)
      }))
    );
    toast.success("Opening balances updated.");
  }

  async function handleAddAccount() {
    if (!newAccountName.trim()) {
      toast.error("Enter a name for the new account.");
      return;
    }

    await accountsRepository.createAccount({
      name: newAccountName,
      type: newAccountType,
      initialBalance: 0,
      currencyCode: settings?.currencyCode ?? "USD",
      userId
    });

    setNewAccountName("");
    setNewAccountType("other");
    toast.success("Custom account added.");
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      toast.error("Enter a name for the new category.");
      return;
    }

    await categoriesRepository.createCategory({
      name: newCategoryName,
      type: newCategoryType,
      userId
    });

    setNewCategoryName("");
    setNewCategoryType("expense");
    toast.success("Custom category added.");
  }

  async function handleReset() {
    await workspaceRepository.resetAppData();
    await saveProfile({
      onboardingCompleted: false,
      preferredCurrency: null
    });
    toast.success("App data reset. Onboarding is starting over.");
    navigate(ROUTES.onboardingCurrency);
  }

  async function handleSignOut() {
    await signOut();
    navigate(ROUTES.login);
  }

  return (
    <PageShell
      title="Settings"
      description="Manage your profile, currency, theme, accounts, reminders, categories, data portability, and reset flow in one place."
    >
      <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile and session</CardTitle>
            <CardDescription>
              The app-level profile is separate from Supabase Auth system tables.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="mt-1 font-semibold">{profile?.name ?? "Not set"}</p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-1 font-semibold">{profile?.email ?? "Unavailable"}</p>
            </div>
            <Button variant="outline" onClick={() => void handleSignOut()}>
              Log out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Currency stays consistent across dashboard, transactions, analytics, and balances.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Currency</label>
              <Select value={settings?.currencyCode ?? "USD"} onValueChange={(value) => void handleCurrencyChange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Theme</label>
              <Select
                value={settings?.themeMode ?? "system"}
                onValueChange={(value) => void handleThemeChange(value as "light" | "dark" | "system")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between rounded-xl border border-border/70 p-4">
              <div>
                <p className="font-semibold">Daily reminder</p>
                <p className="text-sm text-muted-foreground">Persist the preference even where browser delivery varies.</p>
              </div>
              <Switch
                checked={reminderPreferences?.enabled ?? false}
                onCheckedChange={(enabled) =>
                  void settingsRepository.updateNotificationPreferences({
                    enabled
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Reminder time</label>
              <Input
                type="time"
                value={reminderPreferences?.reminderTime ?? "20:00"}
                disabled={!reminderPreferences?.enabled}
                onChange={(event) =>
                  void settingsRepository.updateNotificationPreferences({
                    reminderTime: event.target.value
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portability</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" onClick={() => navigate(ROUTES.importData)}>
              Import data
            </Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.exportData)}>
              Export data
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accounts and balances</CardTitle>
          <CardDescription>
            Cash and Bank stay available. Custom accounts can be added or archived later.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {(accounts ?? []).map((account) => (
            <div key={account.id} className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-[1fr,180px,auto] md:items-end">
              <div>
                <p className="font-semibold">{account.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{account.type.replace("_", " ")}</p>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Opening balance</label>
                <Input
                  type="number"
                  step="0.01"
                  value={accountBalances[account.id] ?? "0"}
                  onChange={(event) =>
                    setAccountBalances((current) => ({
                      ...current,
                      [account.id]: event.target.value
                    }))
                  }
                />
              </div>
              {!account.isDefault ? (
                <Button variant="ghost" onClick={() => void accountsRepository.softDelete(account.id)}>
                  Archive
                </Button>
              ) : (
                <div />
              )}
            </div>
          ))}

          <div className="grid gap-4 rounded-xl border border-dashed border-border/80 p-4 md:grid-cols-[1fr,180px,auto] md:items-end">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">New account name</label>
              <Input value={newAccountName} onChange={(event) => setNewAccountName(event.target.value)} placeholder="e.g. Savings" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Type</label>
              <Select value={newAccountType} onValueChange={(value) => setNewAccountType(value as AccountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="mobile_money">Mobile money</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => void handleAddAccount()}>Add account</Button>
          </div>

          <Button variant="secondary" onClick={() => void handleSaveBalances()}>
            Save balances
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category management</CardTitle>
          <CardDescription>
            System categories stay available, while custom categories can be added or removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(categories ?? []).map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{category.type}</p>
                </div>
                {!category.isSystem ? (
                  <Button variant="ghost" onClick={() => void categoriesRepository.softDelete(category.id)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid gap-4 rounded-xl border border-dashed border-border/80 p-4 md:grid-cols-[1fr,180px,auto] md:items-end">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">New category</label>
              <Input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="e.g. Transport"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Type</label>
              <Select value={newCategoryType} onValueChange={(value) => setNewCategoryType(value as TransactionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => void handleAddCategory()}>Add category</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle>Reset app data</CardTitle>
          <CardDescription>
            This clears the local workspace, reseeds system defaults, and restarts onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="accent">Reset app data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset local app data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears transactions, categories, accounts, reminders, import/export history, and sync metadata in this browser. System defaults will be re-created and onboarding will restart.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleReset()}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </PageShell>
  );
}

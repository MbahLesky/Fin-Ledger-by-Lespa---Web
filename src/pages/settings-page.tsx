import { useEffect, useState } from "react";
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
import { useBackendQuery } from "@/hooks/use-backend-query";
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
  const { data: settings } = useBackendQuery(() => settingsRepository.getSettings(), []);
  const { data: reminderPreferences } = useBackendQuery(
    () => settingsRepository.getNotificationPreferences(),
    []
  );
  const { data: accounts = [] } = useBackendQuery(() => accountsRepository.listActive(), []);
  const { data: categories = [] } = useBackendQuery(() => categoriesRepository.listActive(), []);
  const setThemeMode = useUiStore((state) => state.setThemeMode);

  const [accountBalances, setAccountBalances] = useState<Record<string, string>>({});
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>("other");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>("expense");

  useEffect(() => {
    if (!accounts.length) {
      return;
    }

    setAccountBalances(
      Object.fromEntries(accounts.map((account) => [account.id, account.initialBalance.toString()]))
    );
  }, [accounts]);

  async function handleCurrencyChange(currencyCode: string) {
    try {
      await settingsRepository.setCurrency(currencyCode);
      await accountsRepository.updateDefaultAccountCurrency(currencyCode);
      await saveProfile({
        preferredCurrency: currencyCode
      });
      toast.success("Currency updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update currency.");
    }
  }

  async function handleThemeChange(themeMode: "light" | "dark" | "system") {
    try {
      await settingsRepository.setThemeMode(themeMode);
      setThemeMode(themeMode);
      toast.success("Theme preference saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save theme preference.");
    }
  }

  async function handleSaveBalances() {
    try {
      await accountsRepository.saveOpeningBalances(
        Object.entries(accountBalances).map(([id, balance]) => ({
          id,
          balance: Number(balance || 0)
        }))
      );
      toast.success("Opening balances updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save opening balances.");
    }
  }

  async function handleAddAccount() {
    if (!newAccountName.trim()) {
      toast.error("Enter a name for the new account.");
      return;
    }

    try {
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add account.");
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      toast.error("Enter a name for the new category.");
      return;
    }

    try {
      await categoriesRepository.createCategory({
        name: newCategoryName,
        type: newCategoryType,
        userId
      });

      setNewCategoryName("");
      setNewCategoryType("expense");
      toast.success("Custom category added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add category.");
    }
  }

  async function handleReset() {
    try {
      await workspaceRepository.resetAppData();
      await saveProfile({
        onboardingCompleted: false,
        preferredCurrency: null
      });
      toast.success("App data reset. Onboarding is starting over.");
      navigate(ROUTES.onboardingCurrency);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset app data.");
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate(ROUTES.login);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log out.");
    }
  }

  async function handleReminderEnabled(enabled: boolean) {
    try {
      await settingsRepository.updateNotificationPreferences({ enabled });
      toast.success("Reminder preference saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update reminders.");
    }
  }

  async function handleReminderTime(reminderTime: string) {
    try {
      await settingsRepository.updateNotificationPreferences({ reminderTime });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update reminder time.");
    }
  }

  async function handleArchiveAccount(id: string) {
    try {
      await accountsRepository.softDelete(id);
      toast.success("Account archived.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to archive account.");
    }
  }

  async function handleRemoveCategory(id: string) {
    try {
      await categoriesRepository.softDelete(id);
      toast.success("Category removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove category.");
    }
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
                onCheckedChange={(enabled) => void handleReminderEnabled(enabled)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Reminder time</label>
              <Input
                type="time"
                value={reminderPreferences?.reminderTime ?? "20:00"}
                disabled={!reminderPreferences?.enabled}
                onChange={(event) => void handleReminderTime(event.target.value)}
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
          {accounts.map((account) => (
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
                <Button variant="ghost" onClick={() => void handleArchiveAccount(account.id)}>
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
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
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
            Default income and expense categories are created for your account, and categories can be added or removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-xl border border-border/70 p-4">
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">{category.type}</p>
                </div>
                {!category.isSystem ? (
                  <Button variant="ghost" onClick={() => void handleRemoveCategory(category.id)}>
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
            This clears your Supabase-backed ledger data for this account, reseeds account defaults, and restarts onboarding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="accent">Reset app data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset app data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears transactions, categories, accounts, reminders, settings, and local import/export history for this signed-in account. Default records will be re-created and onboarding will restart.
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

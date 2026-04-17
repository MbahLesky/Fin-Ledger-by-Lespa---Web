import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { TransactionForm } from "@/features/transactions/transaction-form";
import { useAuthStore } from "@/store/auth-store";

export function AddTransactionPage() {
  const userId = useAuthStore((state) => state.user?.id ?? null);

  return (
    <PageShell
      title="Add transaction"
      description="Capture income or expense records directly in Supabase so web and mobile stay aligned."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Manual entry</CardTitle>
            <CardDescription>
              Amount, type, category, account, note, and date are validated before MoniLog saves to the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionForm userId={userId} />
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-primary-foreground">How this save works</CardTitle>
            <CardDescription className="text-primary-foreground/84">
              Shared ledger writes are online-first in this phase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-primary-foreground/88">
            <p>1. The form validates the amount, type, category, account, and date.</p>
            <p>2. The transaction is written directly to Supabase for the signed-in user.</p>
            <p>3. Realtime updates refresh dashboard, history, and analytics views.</p>
            <p>4. If the network is unavailable, the save fails clearly instead of queuing offline.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

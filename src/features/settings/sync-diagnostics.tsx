import { useLiveQuery } from "dexie-react-hooks";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { appDb, getOptionalTable } from "@/db/dexie";
import { clearCheckpoints } from "@/services/sync-checkpoints";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";
import { formatRelativeTime } from "@/utils/formatting";

async function readLocalCounts() {
  const transfersTable = getOptionalTable("transfers");
  const [accounts, categories, transactions, transfers, queued] = await Promise.all([
    appDb.accounts.count(),
    appDb.categories.count(),
    appDb.transactions.count(),
    transfersTable ? transfersTable.count() : Promise.resolve(0),
    appDb.syncOperations.count()
  ]);

  return { accounts, categories, transactions, transfers, queued };
}

/**
 * A plain readout of what this browser holds and what the last sync saw.
 *
 * When someone reports records they can see in the database but not in the app,
 * this is what turns the report into an answer: whether the pull reached the
 * account at all, how many documents it fetched, and how many of them the device
 * actually stored.
 */
export function SyncDiagnostics() {
  const userId = useAuthStore((state) => state.user?.uid ?? null);
  const runNow = useSyncStore((state) => state.runNow);
  const processing = useSyncStore((state) => state.processing);
  const lastOutcomes = useSyncStore((state) => state.lastOutcomes);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const syncError = useSyncStore((state) => state.error);
  const counts = useLiveQuery(() => readLocalCounts(), []);

  async function handleFullResync() {
    if (!userId) {
      return;
    }

    clearCheckpoints(userId);
    const pulled = await runNow(userId);

    if (pulled) {
      toast.success("Resync finished.");
      return;
    }

    toast.error("Resync could not reach the cloud.", {
      description: "Check your connection and try again."
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync diagnostics</CardTitle>
        <CardDescription>
          What this browser holds, and what the last sync fetched from your account. Share this if
          records are missing.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-xl border border-border/70 p-4">
          <p className="text-sm text-muted-foreground">Account id</p>
          <p className="mt-1 break-all font-mono text-xs">{userId ?? "Not signed in"}</p>
        </div>

        <div className="grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Stored on this device</span>
            <span className="text-right">
              {counts
                ? `${counts.transactions} transactions, ${counts.transfers} transfers, ${counts.accounts} accounts, ${counts.categories} categories`
                : "Reading..."}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Waiting to upload</span>
            <span>{counts ? counts.queued : "-"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Last sync activity</span>
            <span>{formatRelativeTime(lastSyncedAt)}</span>
          </div>
          {syncError ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Last error</span>
              <span className="text-right text-danger">{syncError}</span>
            </div>
          ) : null}
        </div>

        {lastOutcomes?.length ? (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase text-muted-foreground">
                  <th className="p-3 font-medium">Records</th>
                  <th className="p-3 font-medium">Found in cloud</th>
                  <th className="p-3 font-medium">Saved here</th>
                </tr>
              </thead>
              <tbody>
                {lastOutcomes.map((outcome) => (
                  <tr key={outcome.entityName} className="border-b border-border/40 last:border-0">
                    <td className="p-3">{outcome.entityName}</td>
                    <td className="p-3">{outcome.fetched}</td>
                    <td className="p-3">{outcome.applied}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No sync has run yet in this session. Run one to see what your account holds.
          </p>
        )}

        <Button
          variant="outline"
          className="justify-self-start"
          disabled={!userId || processing}
          isLoading={processing}
          onClick={() => void handleFullResync()}
        >
          <RefreshCw className="size-4" />
          Re-download everything
        </Button>
      </CardContent>
    </Card>
  );
}

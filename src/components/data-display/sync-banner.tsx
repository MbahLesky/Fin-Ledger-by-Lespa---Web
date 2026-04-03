import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/data-display/status-pill";
import { formatRelativeTime } from "@/utils/formatting";

interface SyncBannerProps {
  pending: number;
  failed: number;
  processing: boolean;
  lastSyncedAt?: string | null;
  isOnline: boolean;
  onRetry?: () => void;
}

export function SyncBanner({
  pending,
  failed,
  processing,
  lastSyncedAt,
  isOnline,
  onRetry
}: SyncBannerProps) {
  if (pending === 0 && failed === 0 && isOnline) {
    return null;
  }

  return (
    <Card className="border-primary/15 bg-primary/5">
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={processing ? "processing" : failed > 0 ? "failed" : "pending"} />
            {!isOnline ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <WifiOff className="size-3.5" />
                Offline
              </span>
            ) : null}
          </div>
          <p className="text-sm text-foreground">
            {failed > 0
              ? `${failed} item${failed === 1 ? "" : "s"} need another sync attempt.`
              : `${pending} change${pending === 1 ? "" : "s"} will sync when your connection is ready.`}
          </p>
          <p className="text-xs text-muted-foreground">
            Last sync update: {formatRelativeTime(lastSyncedAt)}
          </p>
        </div>
        {onRetry ? (
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={!isOnline || processing}
          >
            <RefreshCw className="size-4" />
            Retry sync
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}


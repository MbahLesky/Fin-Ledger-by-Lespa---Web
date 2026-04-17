import { Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeStore } from "@/store/realtime-store";
import { formatRelativeTime } from "@/utils/formatting";

interface RealtimeStatusBannerProps {
  isOnline: boolean;
  onReconnect?: () => void;
}

export function RealtimeStatusBanner({ isOnline, onReconnect }: RealtimeStatusBannerProps) {
  const status = useRealtimeStore((state) => state.status);
  const lastEventAt = useRealtimeStore((state) => state.lastEventAt);
  const error = useRealtimeStore((state) => state.error);

  const showBanner = !isOnline || status === "connecting" || status === "error" || status === "offline";

  if (!showBanner) {
    return null;
  }

  const isProblem = !isOnline || status === "error" || status === "offline";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${isProblem ? "text-accent" : "text-secondary"}`}>
          {isProblem ? <WifiOff className="size-4" /> : <Wifi className="size-4" />}
        </div>
        <div>
          <p className="font-semibold">
            {isProblem ? "Shared backend connection needs attention" : "Connecting to live backend data"}
          </p>
          <p className="text-muted-foreground">
            {error ??
              (isOnline
                ? "The app is reconnecting to Supabase Realtime. Shared data will refresh from the backend."
                : "Shared ledger changes are online-first in this phase. Local-only import/export history stays available.")}
          </p>
          {lastEventAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Last backend update: {formatRelativeTime(lastEventAt)}
            </p>
          ) : null}
        </div>
      </div>
      {onReconnect ? (
        <Button variant="outline" size="sm" onClick={onReconnect}>
          Refresh data
        </Button>
      ) : null}
    </div>
  );
}

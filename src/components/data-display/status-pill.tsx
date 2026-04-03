import { AlertTriangle, CheckCircle2, Clock3, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SyncStatus } from "@/types";

interface StatusPillProps {
  status: SyncStatus | "processing";
}

export function StatusPill({ status }: StatusPillProps) {
  if (status === "synced") {
    return (
      <Badge variant="success" className="gap-1.5">
        <CheckCircle2 className="size-3.5" />
        Synced
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge variant="accent" className="gap-1.5">
        <AlertTriangle className="size-3.5" />
        Needs retry
      </Badge>
    );
  }

  if (status === "processing") {
    return (
      <Badge variant="default" className="gap-1.5">
        <LoaderCircle className="size-3.5 animate-spin" />
        Syncing
      </Badge>
    );
  }

  return (
    <Badge variant="muted" className="gap-1.5">
      <Clock3 className="size-3.5" />
      Pending
    </Badge>
  );
}


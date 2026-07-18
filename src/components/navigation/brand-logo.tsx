import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import finTrackLogo from "@/assets/logo/fin_track_logo.png";

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
        <img src={finTrackLogo} alt={`${APP_NAME} logo`} className="h-full w-full object-contain p-1" />
      </div>
      {!compact ? (
        <div>
          <p className="text-sm font-semibold text-primary">{APP_NAME}</p>
          <p className="text-xs text-muted-foreground">Calm personal money tracking</p>
        </div>
      ) : null}
    </div>
  );
}

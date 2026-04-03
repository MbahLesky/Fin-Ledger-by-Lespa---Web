import { cn } from "@/lib/utils";

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-brand-gradient shadow-card">
        <div className="absolute inset-[5px] rounded-[18px] bg-white/92 dark:bg-surface/92" />
        <div className="relative flex flex-col gap-1">
          <span className="h-1.5 w-5 rounded-full bg-primary" />
          <span className="h-1.5 w-3 rounded-full bg-secondary" />
          <span className="h-1.5 w-4 rounded-full bg-accent" />
        </div>
      </div>
      {!compact ? (
        <div>
          <p className="text-sm font-semibold text-primary">Finance Ledger</p>
          <p className="text-xs text-muted-foreground">Calm personal money tracking</p>
        </div>
      ) : null}
    </div>
  );
}


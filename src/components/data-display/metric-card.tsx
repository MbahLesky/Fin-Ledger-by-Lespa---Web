import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "primary" | "secondary" | "accent";
  trendLabel?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  trendLabel
}: MetricCardProps) {
  const toneClasses =
    tone === "secondary"
      ? "bg-secondary/12 text-secondary"
      : tone === "accent"
        ? "bg-accent/12 text-accent"
        : "bg-primary/12 text-primary";

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
          {trendLabel ? (
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {tone === "accent" ? (
                <ArrowDownRight className="size-3.5 text-accent" />
              ) : (
                <ArrowUpRight className="size-3.5 text-secondary" />
              )}
              {trendLabel}
            </div>
          ) : null}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", toneClasses)}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}


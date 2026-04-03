import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <Card className="border-dashed bg-card/80">
      <CardContent className="flex flex-col items-start gap-4 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && onAction ? (
          <Button
            variant="secondary"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}


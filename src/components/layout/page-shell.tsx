import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageShell({ title, description, action, children, className }: PageShellProps) {
  return (
    <div className={cn("page-grid", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {description ? <p className="max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

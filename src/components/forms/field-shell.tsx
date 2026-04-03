import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FieldShellProps {
  htmlFor?: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ htmlFor, label, hint, error, className, children }: FieldShellProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}


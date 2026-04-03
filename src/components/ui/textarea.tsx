import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError = false, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[112px] w-full rounded-lg border px-4 py-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          hasError
            ? "border-danger/60 bg-danger/5 focus-visible:ring-danger/40"
            : "border-border/80 bg-card hover:border-primary/25",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };


import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground",
        success: "bg-secondary/12 text-secondary dark:bg-secondary/20 dark:text-secondary-foreground",
        accent: "bg-accent/12 text-accent dark:bg-accent/20 dark:text-accent-foreground",
        muted: "bg-muted text-muted-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Primary page title — renders as h1 (default) or h2 (compact) */
  title: string;
  /** Optional secondary line below the title */
  subtitle?: string;
  /**
   * Optional small label rendered above the title.
   * Use for context like "Welcome back," or "Founder · Stage: Assess"
   */
  eyebrow?: string;
  /**
   * Optional right-side slot — typically a Button, Badge, or action group.
   * Rendered at the end of the flex row, shrinks to fit.
   */
  action?: ReactNode;
  /**
   * default  — full h1 with eyebrow + subtitle. Used on every app page.
   * compact  — smaller h2 with optional action. Used inside tabbed sections.
   */
  variant?: "default" | "compact";
  className?: string;
}

/**
 * PageHeader
 *
 * Standardised page-level header for all authenticated app routes.
 * Replaces the repeated pattern of:
 *   <h1 className="font-display text-3xl font-bold">...</h1>
 *   <p className="mt-1 text-sm text-muted-foreground">...</p>
 *
 * Usage (default):
 *   <PageHeader
 *     eyebrow="Welcome back,"
 *     title="Amara Okafor"
 *     subtitle="FarmLink Africa · Stage: Validate"
 *     action={<Button variant="hero">Update Vantage</Button>}
 *   />
 *
 * Usage (compact, inside a tab or card):
 *   <PageHeader variant="compact" title="Members" action={<Badge>42</Badge>} />
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
  variant = "default",
  className,
}: PageHeaderProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center justify-between gap-4", className)}>
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-sm text-muted-foreground">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

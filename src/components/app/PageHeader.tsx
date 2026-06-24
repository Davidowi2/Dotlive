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
        <div className="min-w-0">
          <h2 className="font-display text-xl font-light tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-6 pb-8 border-b border-border sm:flex-row sm:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-primary/60" />
            <span className="tracking-editorial text-primary">{eyebrow}</span>
          </div>
        )}
        <h1 className="font-display text-4xl font-light tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground font-light">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
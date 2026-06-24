import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Lucide icon to display */
  icon: LucideIcon;
  /** Short heading — "No courses yet", "No sessions scheduled" */
  title: string;
  /** Optional supporting description */
  description?: string;
  /**
   * Optional action — typically a Button or Link.
   * Rendered below the description.
   */
  action?: ReactNode;
  /**
   * card      (default) — dashed-border card. Use at the top level of a page
   *                        section when a list is empty (Academy, Sessions, etc.)
   *
   * inline               — no border, just centred content. Use inside an existing
   *                        card (e.g. empty member table, empty orders list).
   *
   * full-page            — vertically centred in the full content column. Use when
   *                        the entire page has no content (first-time states).
   */
  variant?: "card" | "inline" | "full-page";
  className?: string;
}

/**
 * EmptyState
 *
 * Standardised empty/zero-data state for all authenticated pages.
 * Replaces 9+ different hand-rolled empty state implementations.
 *
 * Usage (card — default):
 *   <EmptyState
 *     icon={BookOpen}
 *     title="No courses yet"
 *     description="Check back soon — new learning tracks are being added."
 *   />
 *
 * Usage (inline — inside a card):
 *   <EmptyState
 *     variant="inline"
 *     icon={Users}
 *     title="No members yet"
 *     description="Share your referral link to onboard founders."
 *   />
 *
 * Usage (full-page — first-time experience):
 *   <EmptyState
 *     variant="full-page"
 *     icon={Gauge}
 *     title="Take your first Vantage"
 *     description="Answer 19 questions and unlock your venture report."
 *     action={<Button variant="hero" onClick={start}>Start now</Button>}
 *   />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "card",
  className,
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-10 text-center", className)}>
        <Icon className="size-6 text-muted-foreground/50" />
        <p className="text-sm font-light text-muted-foreground">{title}</p>
        {description && <p className="max-w-xs text-xs text-muted-foreground/70 font-light">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  if (variant === "full-page") {
    return (
      <div className={cn("flex flex-1 flex-col items-center justify-center gap-5 py-20 text-center", className)}>
        <div className="flex size-14 items-center justify-center rounded-sm border border-border bg-muted/30">
          <Icon className="size-6 text-muted-foreground" />
        </div>
        <div className="max-w-sm">
          <h2 className="font-display text-xl font-light tracking-tight">{title}</h2>
          {description && <p className="mt-2 text-sm text-muted-foreground font-light">{description}</p>}
        </div>
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  return (
    <div className={cn("mt-6 flex flex-col items-center gap-4 border border-dashed border-border bg-card px-6 py-14 text-center", className)}>
      <div className="flex size-10 items-center justify-center rounded-sm bg-muted/40">
        <Icon className="size-5 text-muted-foreground/60" />
      </div>
      <div>
        <p className="font-display text-sm font-light text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-xs text-xs text-muted-foreground font-light">{description}</p>}
      </div>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

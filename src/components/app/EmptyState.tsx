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
      <div
        className={cn(
          "flex flex-col items-center gap-2 py-8 text-center",
          className,
        )}
      >
        <Icon className="size-7 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }

  if (variant === "full-page") {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center",
          className,
        )}
      >
        {/* Gradient icon container — one branded element per full-page state */}
        <span
          className="flex size-16 items-center justify-center rounded-2xl
                     [background-image:var(--gradient-primary)] text-primary-foreground
                     shadow-glow"
        >
          <Icon className="size-8" />
        </span>
        <div className="max-w-sm">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  // variant === "card" (default)
  return (
    <div
      className={cn(
        "mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed",
        "border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </span>
      <div>
        <p className="font-display text-sm font-semibold text-foreground">
          {title}
        </p>
        {description && (
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Accent palette — matches the four pillar accents used across the app.
 * ErrorState defaults to destructive tone, but the `accent` prop can be
 * used to match the page's accent colour (e.g. teal for academy).
 */
export type ErrorStateAccent = "destructive" | "primary" | "teal" | "gold" | "purple";

interface ErrorStateProps {
  /** Short heading — "We couldn't load your courses" */
  title: string;
  /** Supporting description — explain what failed in plain language. */
  message: string;
  /**
   * Optional retry handler. When provided, a "Try again" button is shown
   * in the footer slot. Use for failed fetches / loaders.
   */
  onRetry?: () => void;
  /**
   * Optional override icon. Defaults to `AlertTriangle` so we never say
   * "Error 500" — we always show a calm, human shape.
   */
  icon?: LucideIcon;
  /**
   * card      (default) — dashed-border card. Use at the top level of a page
   *                        section when a list failed to load.
   *
   * inline               — no border, just centred content. Use inside an
   *                        existing card (e.g. failed-to-load widget).
   *
   * full-page            — vertically centred in the full content column. Use
   *                        when the entire page failed to load.
   */
  variant?: "card" | "inline" | "full-page";
  /**
   * Optional accent. Defaults to "destructive". The icon chip + heading
   * take on the matching colour.
   */
  accent?: ErrorStateAccent;
  className?: string;
  /**
   * Custom label for the retry button. Defaults to "Try again".
   */
  retryLabel?: string;
}

const accentClasses: Record<ErrorStateAccent, { text: string; chip: string; ring: string }> = {
  destructive: {
    text: "text-destructive",
    chip: "bg-destructive/10",
    ring: "ring-destructive/20",
  },
  primary: {
    text: "text-primary",
    chip: "bg-primary/10",
    ring: "ring-primary/20",
  },
  teal: {
    text: "text-teal",
    chip: "bg-teal/10",
    ring: "ring-teal/20",
  },
  gold: {
    text: "text-gold",
    chip: "bg-gold/10",
    ring: "ring-gold/20",
  },
  purple: {
    text: "text-purple",
    chip: "bg-purple/10",
    ring: "ring-purple/20",
  },
};

function IconChip({
  icon: Icon = AlertTriangle,
  accent,
  size = "md",
}: {
  icon?: LucideIcon;
  accent: ErrorStateAccent;
  size?: "sm" | "md" | "lg";
}) {
  const a = accentClasses[accent];
  const dims = size === "lg" ? "size-14" : size === "sm" ? "size-10" : "size-12";
  const innerDims = size === "lg" ? "size-7" : size === "sm" ? "size-5" : "size-6";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-sm ring-1 ring-inset",
        dims,
        `${a.chip} ${a.ring}`,
      )}
    >
      <Icon className={cn(innerDims, a.text)} />
    </div>
  );
}

/**
 * ErrorState
 *
 * Standardised failure state for all authenticated pages. Used when a
 * data load fails — not for catastrophic page-level errors (those go
 * through the route's errorComponent).
 *
 * Tone is intentionally calm: "Something went wrong loading this. We're
 * looking into it." Never a raw status code.
 *
 * Usage (card — default):
 *   <ErrorState
 *     title="We couldn't load your courses"
 *     message="Something went wrong on our end. Try again in a moment."
 *     onRetry={() => refetch()}
 *   />
 *
 * Usage (inline — inside a card):
 *   <ErrorState
 *     variant="inline"
 *     title="Couldn't load members"
 *     message="Check your connection and try again."
 *     onRetry={() => refetch()}
 *   />
 *
 * Usage (full-page):
 *   <ErrorState
 *     variant="full-page"
 *     title="This page didn't load"
 *     message="Something went wrong loading this. We're looking into it."
 *     onRetry={() => refetch()}
 *   />
 */
export function ErrorState({
  title,
  message,
  onRetry,
  icon,
  variant = "card",
  accent = "destructive",
  className,
  retryLabel = "Try again",
}: ErrorStateProps) {
  const footer: ReactNode = onRetry ? (
    <div className="mt-3">
      <Button variant="outline" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  ) : null;

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-10 text-center", className)}>
        {/* header */}
        <IconChip icon={icon} accent={accent} size="sm" />
        {/* body */}
        <div className="max-w-xs">
          <p className="text-sm font-light text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground font-light">{message}</p>
        </div>
        {/* footer */}
        {footer}
      </div>
    );
  }

  if (variant === "full-page") {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-5 py-20 text-center",
          className,
        )}
      >
        {/* header */}
        <IconChip icon={icon} accent={accent} size="lg" />
        {/* body */}
        <div className="max-w-sm">
          <h2 className="font-display text-xl font-light tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground font-light">{message}</p>
        </div>
        {/* footer */}
        {onRetry && (
          <div className="mt-4">
            <Button variant="outline" onClick={onRetry}>
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-6 flex flex-col items-center gap-4 border border-dashed border-border bg-card px-6 py-14 text-center",
        className,
      )}
    >
      {/* header */}
      <IconChip icon={icon} accent={accent} size="md" />
      {/* body */}
      <div>
        <p className="font-display text-sm font-light text-foreground">{title}</p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground font-light">{message}</p>
      </div>
      {/* footer */}
      {footer}
    </div>
  );
}

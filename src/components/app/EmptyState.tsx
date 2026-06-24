import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accent palette — matches the four pillar accents used across the app
 * (primary / teal / gold / purple). When `illustration` is supplied it
 * is tinted via `text-{accent}` so it picks up the right hue.
 */
export type EmptyStateAccent = "primary" | "teal" | "gold" | "purple";

interface EmptyStateProps {
  /** Lucide icon to display. Ignored when `illustration` is provided. */
  icon?: LucideIcon;
  /**
   * Optional inline SVG / image / ReactNode to render in the icon slot.
   * Typically a hand-drawn SVG. When provided, `icon` is ignored and
   * `accent` tints it via `text-{accent}`.
   */
  illustration?: ReactNode;
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
  /**
   * Optional accent. When set, the icon chip and/or illustration pick up
   * the matching tint (primary / teal / gold / purple).
   */
  accent?: EmptyStateAccent;
  className?: string;
}

/** Accent → Tailwind text + chip background classes (single source of truth) */
const accentClasses: Record<EmptyStateAccent, { text: string; chip: string; ring: string }> = {
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

/**
 * Small icon chip — used by all three variants. Picks up the accent when
 * one is supplied, otherwise stays muted.
 */
function IconChip({
  icon: Icon,
  illustration,
  accent,
  size = "md",
}: {
  icon?: LucideIcon;
  illustration?: ReactNode;
  accent?: EmptyStateAccent;
  size?: "sm" | "md" | "lg";
}) {
  const a = accent ? accentClasses[accent] : null;
  const dims = size === "lg" ? "size-14" : size === "sm" ? "size-10" : "size-12";
  const innerDims = size === "lg" ? "size-7" : size === "sm" ? "size-5" : "size-6";
  const illustrationDims = size === "lg" ? "size-16" : size === "sm" ? "size-10" : "size-12";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-sm ring-1 ring-inset",
        dims,
        a ? `${a.chip} ${a.ring}` : "bg-muted/40 ring-border",
      )}
    >
      {illustration ? (
        <div
          className={cn(
            illustrationDims,
            "[&_svg]:h-full [&_svg]:w-full",
            a ? a.text : "text-muted-foreground",
          )}
          aria-hidden
        >
          {illustration}
        </div>
      ) : Icon ? (
        <Icon className={cn(innerDims, a ? a.text : "text-muted-foreground")} />
      ) : null}
    </div>
  );
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
 * Usage (card with illustration + accent):
 *   <EmptyState
 *     illustration={<MySvg />}
 *     accent="teal"
 *     title="No members yet"
 *     description="Share your referral link to onboard founders."
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
  icon,
  illustration,
  title,
  description,
  action,
  variant = "card",
  accent,
  className,
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-10 text-center", className)}>
        {/* header */}
        <IconChip
          icon={icon}
          illustration={illustration}
          accent={accent}
          size="sm"
        />
        {/* body */}
        <div className="max-w-xs">
          <p className="text-sm font-light text-foreground">{title}</p>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground font-light">{description}</p>
          )}
        </div>
        {/* footer */}
        {action && <div className="mt-3">{action}</div>}
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
        <IconChip
          icon={icon}
          illustration={illustration}
          accent={accent}
          size="lg"
        />
        {/* body */}
        <div className="max-w-sm">
          <h2 className="font-display text-xl font-light tracking-tight">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground font-light">{description}</p>
          )}
        </div>
        {/* footer */}
        {action && <div className="mt-4">{action}</div>}
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
      <IconChip
        icon={icon}
        illustration={illustration}
        accent={accent}
        size="md"
      />
      {/* body */}
      <div>
        <p className="font-display text-sm font-light text-foreground">{title}</p>
        {description && (
          <p className="mt-1 max-w-xs text-xs text-muted-foreground font-light">{description}</p>
        )}
      </div>
      {/* footer */}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

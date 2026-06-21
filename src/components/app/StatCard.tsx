import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface StatCardTrend {
  /** Visual direction of the trend arrow */
  direction: "up" | "down" | "neutral";
  /**
   * Pre-formatted trend value shown in the pill.
   * Examples: "+12 pts", "↑ 4%", "–2"
   */
  value: string;
  /** Contextual label next to the pill. Example: "vs last assessment" */
  label: string;
}

interface StatCardProps {
  /** Metric label — e.g. "Vantage Point", "DOT Balance", "Members" */
  label: string;
  /**
   * Pre-formatted primary value.
   * Always use formatDot(), formatNaira(), or template literals before passing.
   * Example: formatDot(vantagePoint), `${fundability}%`
   */
  value: string;
  /**
   * Optional secondary line below the value.
   * Examples: "/ 1000", "≈ ₦30,000", "courses done"
   */
  sub?: string;
  /** Lucide icon rendered in the top-right corner */
  icon: LucideIcon;
  /**
   * Accent colour for the icon container.
   * primary = green, gold = amber, muted = gray
   */
  accent?: "primary" | "gold" | "muted";
  /**
   * Optional trend indicator rendered below the value.
   * Shows a coloured pill (success/destructive/muted) with direction icon.
   */
  trend?: StatCardTrend;
  /**
   * If provided, the entire card becomes a <Link> to this route.
   * Useful for quick-navigation stat cards.
   */
  href?: string;
  className?: string;
}

/**
 * StatCard
 *
 * Standardised stat/metric card used across:
 *   /dashboard (Vantage Point, Fundability, DOT Balance, Academy)
 *   /vantage   (Vantage Point, Fundability, Investment Readiness)
 *   /community (Members, Active, Vantage Completed, Avg Vantage)
 *   /work      (Earned, Completed, Rating)
 *   /admin     (Successful payments, DOT funded, Revenue)
 *
 * Usage:
 *   <StatCard
 *     label="Vantage Point"
 *     value={formatDot(vantagePoint)}
 *     sub="/ 1000"
 *     icon={Gauge}
 *     accent="primary"
 *     trend={{ direction: "up", value: "+42 pts", label: "vs last assessment" }}
 *   />
 */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "primary",
  trend,
  href,
  className,
}: StatCardProps) {
  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus;

  const card = (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 transition-shadow",
        href && "hover:shadow-soft hover:border-primary/30 cursor-pointer",
        className,
      )}
    >
      {/* Header row: label + icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground leading-none">
          {label}
        </span>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            accent === "primary" && "bg-primary/10 text-primary",
            accent === "gold" && "bg-gold/10 text-gold",
            accent === "muted" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>

      {/* Value — tabular numbers to prevent layout shift */}
      <p className="mt-4 font-display text-3xl font-bold leading-none tabular">
        {value}
        {sub && (
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
            {sub}
          </span>
        )}
      </p>

      {/* Trend indicator */}
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.direction === "up" &&
                "bg-success/10 text-success",
              trend.direction === "down" &&
                "bg-destructive/10 text-destructive",
              trend.direction === "neutral" &&
                "bg-muted text-muted-foreground",
            )}
          >
            <TrendIcon className="size-3" />
            {trend.value}
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {card}
      </Link>
    );
  }

  return card;
}

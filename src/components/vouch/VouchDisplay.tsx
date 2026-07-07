/**
 * VouchDisplay — compact count + score summary.
 *
 * Shows the user's vouch count and the decayed total score. Tooltip on
 * hover surfaces the breakdown by scope.
 */

import { ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useVouches } from "@/hooks/use-vouches";
import { vouchSummary, VOUCH_VANTAGE_CAP } from "./vouch-utils";

interface VouchDisplayProps {
  userId: string | null | undefined;
  /** When true, hides the "X vouches" copy and shows a single line. */
  compact?: boolean;
  className?: string;
}

export function VouchDisplay({ userId, compact = false, className }: VouchDisplayProps) {
  const { data: vouches, isLoading } = useVouches(userId);

  if (isLoading) {
    return <Skeleton className={compact ? "h-5 w-32" : "h-10 w-48"} />;
  }

  const list = vouches ?? [];
  const summary = vouchSummary(list);
  const capped = Math.min(summary.totalDecayed, VOUCH_VANTAGE_CAP);
  const breakdown = list.reduce<Record<string, number>>((acc, v) => {
    acc[v.scope] = (acc[v.scope] ?? 0) + v.score;
    return acc;
  }, {});

  if (compact) {
    return (
      <span
        className={className}
        title={
          summary.count === 0
            ? "No vouches yet"
            : `Founder: ${breakdown.founder ?? 0} · Builder: ${breakdown.builder ?? 0} · Capital: ${breakdown.capital ?? 0}`
        }
      >
        <span className="inline-flex items-center gap-1.5 text-sm">
          <ShieldCheck className="size-3.5 text-primary" />
          <span className="tabular-nums font-medium">
            {summary.count} vouches
          </span>
          {summary.count > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="tabular-nums text-muted-foreground">
                {capped.toLocaleString()} pts
              </span>
            </>
          )}
        </span>
      </span>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-baseline gap-2">
        <ShieldCheck className="size-4 text-primary" />
        <p className="font-display text-2xl font-light tabular-nums">
          {summary.count}
        </p>
        <p className="text-xs tracking-widest uppercase text-muted-foreground">
          vouches
        </p>
      </div>
      {summary.count > 0 && (
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {capped.toLocaleString()} pts{" "}
          {summary.totalDecayed > VOUCH_VANTAGE_CAP && (
            <span className="text-amber-600 dark:text-amber-400">
              (capped from {summary.totalDecayed.toLocaleString()})
            </span>
          )}
        </p>
      )}
    </div>
  );
}

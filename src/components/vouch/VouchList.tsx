/**
 * VouchList — "Vouched by N" list of people who vouched a user.
 *
 * Pure presentational. Shows scope badge, score, and a relative date.
 * Empty state uses EmptyState.
 */

import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import { useVouches, type Vouch } from "@/hooks/use-vouches";
import { decayedVouchScore } from "./vouch-utils";

interface VouchListProps {
  userId: string | null | undefined;
  /** Cap the visible rows. Default 8. Pass 0 for unlimited. */
  limit?: number;
  className?: string;
}

const SCOPE_LABEL: Record<Vouch["scope"], string> = {
  founder: "Founder",
  builder: "Builder",
  capital: "Capital",
};

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const days = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function VouchList({ userId, limit = 8, className }: VouchListProps) {
  const { data: vouches, isLoading } = useVouches(userId);

  const rows = useMemo<Vouch[]>(() => {
    if (!vouches) return [];
    return limit > 0 ? vouches.slice(0, limit) : vouches;
  }, [vouches, limit]);

  if (isLoading) {
    return (
      <div className={className}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-14 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        variant="inline"
        icon={ShieldCheck}
        accent="primary"
        title="No vouches yet"
        description="Build credibility by collaborating on ventures — peers can vouch you once they've worked with you."
      />
    );
  }

  return (
    <ul className={className}>
      {rows.map((v) => {
        const decayed = decayedVouchScore(v);
        return (
          <li
            key={v.id}
            className="mb-2 flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">
                  Vouched as {SCOPE_LABEL[v.scope]}
                </p>
                <Badge variant="outline" className="text-[10px]">
                  {v.score} pts
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {relTime(v.createdAt)}
                {decayed < v.score && (
                  <>
                    {" · "}
                    <span className="tabular-nums">{decayed} pts after decay</span>
                  </>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

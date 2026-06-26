import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet, TrendingUp, Building2, ExternalLink, Loader2,
  ArrowUpRight, Target, DollarSign,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { dotApi } from "@/api/client";

/**
 * /capital/portfolio — My commitments + ventures funded.
 *
 * Lists all `[CAPITAL_COMMIT]` transactions, sums them per venture,
 * shows each venture's current stage + fundability for context.
 */

export const Route = createFileRoute("/_authenticated/capital/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Capital — DOT" }] }),
  component: CapitalPortfolioPage,
});

type Commitment = {
  id: string;
  amount: number;
  venture: {
    id: string;
    name: string;
    industry: string;
    stage: string;
    country: string;
    fundability: number;
    vantagePoint: number;
    fundingGoal: number;
    userId: string;
  } | null;
  createdAt: string;
};

function CapitalPortfolioPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["capital", "portfolio"],
    queryFn: () => dotApi.get<{ commitments: Commitment[] }>("/api/capital/commitments"),
  });

  const commitments = data?.commitments ?? [];

  // Group by venture for the summary view
  const byVenture = new Map<string, { venture: Commitment["venture"]; total: number; count: number; lastAt: string }>();
  for (const c of commitments) {
    if (!c.venture) continue;
    const key = c.venture.id;
    const existing = byVenture.get(key);
    if (existing) {
      existing.total += c.amount;
      existing.count += 1;
      if (new Date(c.createdAt) > new Date(existing.lastAt)) existing.lastAt = c.createdAt;
    } else {
      byVenture.set(key, { venture: c.venture, total: c.amount, count: 1, lastAt: c.createdAt });
    }
  }
  const ventureRows = Array.from(byVenture.values()).sort((a, b) => b.total - a.total);
  const grandTotal = commitments.reduce((s, c) => s + c.amount, 0);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/capital" className="text-xs text-muted-foreground hover:text-foreground">
            ← Capital
          </Link>
          <h1 className="font-display text-3xl">My portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every commitment you've made to ventures on DOT.
          </p>
        </div>
        <Button asChild>
          <Link to="/discover">Find more ventures</Link>
        </Button>
      </div>

      {/* Summary KPI */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total deployed</div>
            <div className="mt-2 font-display text-3xl tabular-nums">{grandTotal.toLocaleString()} DOT</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Ventures funded</div>
            <div className="mt-2 font-display text-3xl tabular-nums">{ventureRows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Commitments</div>
            <div className="mt-2 font-display text-3xl tabular-nums">{commitments.length}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : commitments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No commitments yet"
          subtitle="Find ventures on the Discover page and deploy DOT into the ones you believe in."
          action={
            <Button asChild>
              <Link to="/discover">Browse ventures</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Per-venture summary */}
          {ventureRows.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">By venture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {ventureRows.map((row) => {
                    const v = row.venture!;
                    return (
                      <Link
                        key={v.id}
                        to="/founder/$id"
                        params={{ id: v.id }}
                        className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {v.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="truncate font-medium group-hover:text-primary">{v.name}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">{v.stage}</Badge>
                            {v.industry && <span>{v.industry}</span>}
                            {v.country && <span>· {v.country}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium tabular-nums">{row.total.toLocaleString()} DOT</div>
                          <div className="text-xs text-muted-foreground">
                            {row.count} commit{row.count === 1 ? "" : "s"}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-commitment list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All commitments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {commitments.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <DollarSign className="size-4" />
                    </div>
                    <div className="flex-1">
                      {c.venture ? (
                        <Link
                          to="/founder/$id"
                          params={{ id: c.venture.id }}
                          className="font-medium hover:text-primary"
                        >
                          {c.venture.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown venture</span>
                      )}
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium tabular-nums text-emerald-600">
                        −{c.amount.toLocaleString()} DOT
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}

/**
 * /referrals — Referral dashboard.
 *
 * Shows:
 *   - Your personal referral code (8-char base36)
 *   - Share link: https://dotlive.cv/r/<CODE>
 *   - Copy-to-clipboard
 *   - Signup count + total DOT earned
 *   - Top 20 leaderboard (network-wide)
 *
 * The link `/r/<CODE>` is not yet a route — it appends `?ref=<CODE>`
 * to the standard signup flow, which is read by the auth signup endpoint.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Users, Wallet, Trophy, ArrowUpRight, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyReferrals, getReferralLeaderboard } from "@/api/referrals";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Referrals — DOT" }] }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const me = useQuery({
    queryKey: ["referrals", "me"],
    queryFn: getMyReferrals,
    staleTime: 30_000,
  });
  const board = useQuery({
    queryKey: ["referrals", "leaderboard"],
    queryFn: getReferralLeaderboard,
    staleTime: 60_000,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Refer & Earn"
          subtitle="Bring builders, founders, and investors onto DOT. You both get 50 DOT."
          icon={<Users className="h-6 w-6" />}
        />

        <PageIntent
          icon={<Users className="size-5" />}
          intent="Who in your network belongs on DOT?"
          context="Your unique link, the people you've brought, and the DOT you've earned. Both sides get 50 DOT."
        />

        {/* My referral code */}
        <Card className="mt-6 p-6">
          {me.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : me.data ? (
            <ReferralCodePanel {...me.data} />
          ) : (
            <p className="text-sm text-muted-foreground">Could not load referral data.</p>
          )}
        </Card>

        {/* Stats */}
        {me.data && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard
              label="People referred"
              value={String(me.data.count)}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="DOT earned"
              value={me.data.earningsDot}
              icon={<Wallet className="h-4 w-4" />}
            />
            <StatCard
              label="Bonus per signup"
              value="+50"
              icon={<Trophy className="h-4 w-4" />}
              hideOnMobile
            />
          </div>
        )}

        {/* Leaderboard */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Top referrers
          </h2>
          {board.isLoading ? (
            <Skeleton className="mt-4 h-64 w-full" />
          ) : board.data && board.data.leaderboard.length > 0 ? (
            <Card className="mt-4 divide-y divide-border">
              {board.data.leaderboard.slice(0, 10).map((row, i) => (
                <div
                  key={row.dotId}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono w-6 text-muted-foreground">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{row.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {row.dotId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{row.referralCount}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.earningsDot} DOT
                    </p>
                  </div>
                </div>
              ))}
            </Card>
          ) : (
            <Card className="mt-4 p-6 text-center text-sm text-muted-foreground">
              No referrals yet. Be the first to share your link!
            </Card>
          )}
        </div>

        {/* How it works */}
        <Card className="mt-10 p-6">
          <h3 className="font-semibold">How it works</h3>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">1. Share</span> your
              link with a builder, founder, or investor.
            </li>
            <li>
              <span className="text-foreground font-medium">2. They sign up</span>{" "}
              using your link.
            </li>
            <li>
              <span className="text-foreground font-medium">3. You both earn</span>{" "}
              50 DOT the moment their account is created.
            </li>
          </ol>
        </Card>
      </div>
    </AppShell>
  );
}

function ReferralCodePanel({
  code,
  link,
  count,
  earningsDot,
}: {
  code: string;
  link: string;
  count: number;
  earningsDot: string;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(text: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(`Copied ${kind}!`);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy. Select and copy manually.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Your referral code
        </p>
        <div className="mt-1 flex items-center gap-2">
          <code className="rounded-md bg-secondary px-3 py-2 font-mono text-xl tracking-wider">
            {code}
          </code>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => copy(code, "code")}
            aria-label="Copy code"
          >
            {copied === "code" ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Share link
        </p>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={link}
            className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-xs sm:text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => copy(link, "link")}
            aria-label="Copy link"
          >
            {copied === "link" ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <a href={link} target="_blank" rel="noreferrer">
            <Button type="button" variant="ghost" size="icon" aria-label="Open">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  hideOnMobile,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hideOnMobile?: boolean;
}) {
  return (
    <Card className={`p-4 ${hideOnMobile ? "hidden sm:block" : ""}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </Card>
  );
}
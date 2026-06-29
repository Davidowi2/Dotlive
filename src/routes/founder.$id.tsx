import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, MapPin, Globe, Gauge, TrendingUp, Target, BookOpen, Trophy,
    Loader2, Shield, ArrowLeft, ArrowUpRight, Wallet, Heart, Users,
    Briefcase, ExternalLink, Sparkles, Vote, ShoppingCart,
} from "lucide-react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { BuySharesDialog } from "@/components/investor/BuySharesDialog";
import { VentureEnrichmentSection } from "@/components/founder/VentureEnrichmentSection";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { formatNaira, formatDot } from "@/lib/constants";
import { getVentureInvestors } from "@/api/investments";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { dotApi } from "@/api/client";

/**
 * Public Founder Profile — shareable URL.
 * /founder/brave-works-26pc4x9l  (or by user id)
 *
 * No auth required. Loads from /api/founders/:idOrDotId.
 * Shows the founder's venture resume: profile, all their ventures,
 * aggregate stats (votes, capital raised), journey position.
 */

export const Route = createFileRoute("/founder/$id")({
  head: () => ({ meta: [{ title: "Founder Profile — DOT" }] }),
  component: PublicFounderProfile,
});

type FounderData = {
  founder: {
    id: string;
    name: string | null;
    dotId: string;
    avatarUrl: string | null;
    createdAt: string;
    roles: string[];
    isFounder: boolean;
    isBuilder: boolean;
    isCapitalPartner: boolean;
  };
  profile: {
      ventureName: string;
      industry: string;
      stage: string;
      country: string;
      bio: string;
      website: string;
      fundingGoal: number;
      logoUrl: string;
      vantagePoint: number;
      fundability: number;
      investmentReadiness: number;
      // Tier 3 — share offer
      sharePriceKobo?: number;
    sharesAvailable?: number;
    totalRaisedDot?: string;
    headcount?: number;
    annualRevenueDot?: string;
    foundedYear?: number;
  } | null;
  stats: {
    totalVotes: number;
    voteCount: number;
    totalRaisedDot: number;
    sponsorCount: number;
    venturesOwned: number;
  };
  ventures: Array<{
    id: string;
    name: string;
    industry: string;
    stage: string;
    country: string;
    fundingGoal: number;
    vantagePoint: number;
    fundability: number;
    createdAt: string;
  }>;
};

function PublicFounderProfile() {
  const { id } = Route.useParams();

  const [data, setData] = useState<FounderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyOpen, setBuyOpen] = useState(false);
  const { user } = useDotAuth();
  const investorsQ = useQuery({
    queryKey: ["venture-investors", data?.founder?.id],
    queryFn: () => getVentureInvestors(data!.founder.id),
    enabled: !!data?.founder?.id,
    retry: false,
  });
  function onOpenBuy() {
    if (!user) {
      window.location.href = `/auth?mode=signin&next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`;
      return;
    }
    setBuyOpen(true);
  }
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dotApi.get<FounderData>(`/api/founders/${encodeURIComponent(id)}`)
      .then((d) => setData(d))
      .catch((e) => setError(e?.message ?? "Could not load founder profile"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl py-20 text-center">
          <Building2 className="mx-auto size-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl">Founder not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? "This founder profile doesn't exist or hasn't been set up yet."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const { founder, profile, stats, ventures: myVentures } = data;
  const displayName = founder.name ?? profile?.ventureName ?? "Anonymous Founder";

  return (
    <PageShell>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-primary/5 to-transparent py-12">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 sm:flex-row sm:items-start sm:px-6 lg:px-8">
          <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-3xl font-bold text-primary-foreground">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {profile?.ventureName && (
                <h1 className="font-display text-3xl">{profile.ventureName}</h1>
              )}
              {founder.isFounder && <Badge variant="secondary">Founder</Badge>}
              {founder.isBuilder && <Badge variant="secondary">Builder</Badge>}
              {founder.isCapitalPartner && <Badge variant="default">Capital Partner</Badge>}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>by</span>
              <strong className="text-foreground">{founder.name ?? "—"}</strong>
              <span>·</span>
              <code className="text-xs">{founder.dotId}</code>
            </div>
            {profile?.bio && (
              <p className="mt-4 max-w-2xl text-pretty leading-relaxed">{profile.bio}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {profile?.industry && (
                <span className="flex items-center gap-1"><Briefcase className="size-3.5" /> {profile.industry}</span>
              )}
              {profile?.country && (
                <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {profile.country}</span>
              )}
              {profile?.stage && (
                <span className="flex items-center gap-1"><Target className="size-3.5" /> Stage: {profile.stage}</span>
              )}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary hover:underline">
                  <Globe className="size-3.5" /> {profile.website.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
                      {profile && Number(profile.sharePriceKobo ?? 0) > 0 && Number(profile.sharesAvailable ?? 0) > 0 ? (
                        <BuyerButton profile={profile} onBuy={onOpenBuy} />
                      ) : !user ? (
                        <Button asChild variant="hero">
                          <Link to="/auth" search={{ mode: "signup" }}>Join DOT to invest</Link>
                        </Button>
                      ) : null}
                      <Button variant="outline" asChild>
                        <Link to="/discover">Find more founders</Link>
                      </Button>
                    </div>
        </div>
      </section>

      {/* Share offer — only when founder has priced shares */}
      {profile && Number(profile.sharePriceKobo ?? 0) > 0 && (
        <ShareOfferStrip profile={profile} onBuy={onOpenBuy} authed={!!user} />
      )}

      {/* Investors strip — only when there are confirmed investors */}
      {investorsQ.data && investorsQ.data.investorCount > 0 && (
        <InvestorsStrip investors={investorsQ.data} />
      )}

      {/* KPI strip */}
      <section className="border-b border-border py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
          <Kpi icon={Gauge} label="Vantage Point" value={profile?.vantagePoint?.toLocaleString() ?? "—"} hint="0-1000 reputation" />
          <Kpi icon={TrendingUp} label="Fundability" value={`${profile?.fundability ?? 0}%`} hint="Investment likelihood" />
          <Kpi icon={Heart} label="Community votes" value={stats.totalVotes.toLocaleString()} hint={`${stats.voteCount} votes cast`} />
          <Kpi icon={Wallet} label="DOT raised" value={stats.totalRaisedDot.toLocaleString()} hint={`${stats.sponsorCount} sponsor${stats.sponsorCount === 1 ? "" : "s"}`} />
        </div>
      </section>

      {/* Founder profile enrichment (11 fields) — uses the first venture they own */}
      {myVentures?.[0]?.id && (
        <section className="border-b border-border py-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <VentureEnrichmentSection
              ventureId={myVentures[0].id}
              isOwner={!!user && user.id === founder.id}
            />
          </div>
        </section>
      )}

      {/* Journey position */}
      {profile?.vantagePoint !== undefined && (
        <section className="border-b border-border py-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-xl">Journey position</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Where {profile.ventureName ?? "this venture"} sits in the DOT 7-stage journey.
            </p>
            <JourneyStrip currentStage={profile.stage} vantagePoint={profile.vantagePoint} />
          </div>
        </section>
      )}

      {/* All ventures by this founder */}
      {myVentures.length > 0 && (
        <section className="border-b border-border py-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-xl">Ventures by {founder.name}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {myVentures.map((v) => (
                <Card key={v.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-display text-lg">{v.name}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{v.industry}</span>
                          <span>·</span>
                          <span>{v.stage}</span>
                          {v.country && <><span>·</span><span>{v.country}</span></>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Vantage</div>
                        <div className="font-bold tabular-nums">{v.vantagePoint}</div>
                      </div>
                    </div>
                    {Number(v.fundingGoal) > 0 && (
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Funding goal</span>
                        <span className="font-medium tabular-nums">{Number(v.fundingGoal).toLocaleString()} DOT</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state when no profile is set */}
      {!profile && myVentures.length === 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <Sparkles className="mx-auto size-12 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl">Profile not yet complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {displayName} hasn't filled out a public profile yet. Check back later or invite them.
            </p>
            <Button asChild className="mt-6">
              <Link to="/discover">Browse other founders</Link>
            </Button>
          </div>
        </section>
      )}

      {/* Buy Shares Dialog */}
      {profile && (
        <BuySharesDialog
          open={buyOpen}
          onOpenChange={setBuyOpen}
          venture={{
            founderId: data.founder.id,
            founderName: data.founder.name,
            ventureName: profile.ventureName ?? "this venture",
            sharePriceKobo: Number(profile.sharePriceKobo ?? 0),
            sharesAvailable: Number(profile.sharesAvailable ?? 0),
          }}
        />
      )}

      {/* Share footer */}
      <section className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <ShareLink url={`${typeof window !== "undefined" ? window.location.origin : ""}/founder/${founder.dotId}`} />
            <p className="text-xs text-muted-foreground">
              Last updated {new Date(founder.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const JOURNEY_STAGES = ["Identity", "Assessment", "Progress", "Contribution", "Opportunity", "Funding", "Ownership"];
function JourneyStrip({ currentStage, vantagePoint }: { currentStage: string; vantagePoint: number }) {
  // Map stage names (Assess/Validate/Build/Fund/Scale) to 7-stage journey
  const stageMap: Record<string, number> = {
    Assess: 1, Learn: 2, Improve: 2, Validate: 3,
    Pitch: 4, Build: 5, Fund: 5, Scale: 6, Exit: 6,
  };
  const currentIdx = stageMap[currentStage] ?? Math.min(Math.floor(vantagePoint / 150), 6);
  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-1">
        {JOURNEY_STAGES.map((s, i) => (
          <div
            key={s}
            className={cn(
              "rounded-lg p-2 text-center text-xs",
              i < currentIdx ? "bg-primary/15 text-primary" :
              i === currentIdx ? "bg-primary text-primary-foreground font-medium" :
              "bg-muted text-muted-foreground"
            )}
          >
            <div className="font-medium">{s}</div>
            <div className="text-[10px] opacity-70">{i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="rounded-md bg-background px-3 py-1.5 text-xs text-muted-foreground">{url}</code>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied!" : "Copy share link"}
      </Button>
    </div>
  );
}


/* ───────── Investor UI helpers ───────── */

function BuyerButton({ profile, onBuy }: { profile: any; onBuy: () => void }) {
  return (
    <Button variant="hero" onClick={onBuy}>
      <ShoppingCart className="size-4" />
      Buy shares · {formatNaira(Math.round(Number(profile.sharePriceKobo ?? 0) / 100))}
    </Button>
  );
}

function ShareOfferStrip({ profile, onBuy, authed }: { profile: any; onBuy: () => void; authed: boolean }) {
  const priceKobo = Number(profile.sharePriceKobo ?? 0);
  const available = Number(profile.sharesAvailable ?? 0);
  const totalRaiseDot = (available * priceKobo) / 1500;
  return (
    <section className="border-b border-border bg-primary/5 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border-2 border-primary/30 bg-card p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-primary">Open to investors</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">
                {available.toLocaleString()} shares at {formatNaira(Math.round(priceKobo / 100))} each
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                ≈ {formatDot(totalRaiseDot)} DOT total raise available · prices are set by the founder
              </p>
            </div>
            <Button variant="hero" onClick={onBuy} size="lg">
              <ShoppingCart className="size-4" />
              Buy shares
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function InvestorsStrip({ investors }: { investors: { totalShares: number; totalRaisedDot: string; investorCount: number } }) {
  return (
    <section className="border-b border-border py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl">Backed by {investors.investorCount} investor{investors.investorCount === 1 ? "" : "s"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total raised</div>
            <div className="mt-1 font-display text-2xl tabular-nums">
              {formatDot(Number(investors.totalRaisedDot))} DOT
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              ≈ {formatNaira(Math.round(Number(investors.totalRaisedDot) * 15))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Shares sold</div>
            <div className="mt-1 font-display text-2xl tabular-nums">{investors.totalShares.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

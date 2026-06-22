import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gauge,
  BookOpen,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  Hammer,
  Briefcase,
  Star,
  UserCircle,
  Lock,
  Store,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  useWallet,
  useFounderProfile,
  useAssessments,
  useMyEnrollments,
  useMyMembership,
  useMyBuilderProfile,
  useBuilderStats,
} from "@/hooks/use-dot-data";
import { JOURNEY_STAGES, dotToNaira, formatDot, formatNaira } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DOT" },
      { name: "description", content: "Your DOT dashboard — wallet, stats, and next actions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, primaryRole, roles } = useAuth();
  const { data: balance = 0, isLoading: walletLoading } = useWallet();
  const { data: founder, isLoading: founderLoading } = useFounderProfile();
  const { data: assessments = [], isLoading: assessLoading } = useAssessments();
  const { data: enrollments = [], isLoading: enrollLoading } = useMyEnrollments();
  const { data: membership } = useMyMembership();
  const { data: builderProfile } = useMyBuilderProfile();
  const { data: builderStats } = useBuilderStats(profile?.id ?? undefined);

  const isLoading = walletLoading || founderLoading || assessLoading || enrollLoading;

  if (isLoading) {
    return (
      <AppShell>
        <PageSkeleton.Header />
        <PageSkeleton.StatCards count={4} />
        <PageSkeleton.ProgressBar />
        <PageSkeleton.ActionCards />
      </AppShell>
    );
  }

  const isFounder = roles.includes("founder");
  const isBuilderOnly = roles.length > 0 && !isFounder && !roles.some((r) =>
    ["investor", "community_leader", "vendor", "capital_partner", "admin", "super_admin"].includes(r)
  );

  const latest = assessments[assessments.length - 1];
  const prev = assessments.length >= 2 ? assessments[assessments.length - 2] : null;
  const vantagePoint = founder?.vantage_point ?? latest?.vantage_point ?? 0;
  const fundability = founder?.fundability ?? latest?.fundability ?? 0;
  const stage = (founder?.stage as string) ?? "Assess";
  const completed = enrollments.filter((e) => e.status === "completed").length;
  const currentStageIndex = JOURNEY_STAGES.indexOf(stage as (typeof JOURNEY_STAGES)[number]);

  const vantageTrend = prev
    ? {
        direction: vantagePoint > prev.vantage_point ? ("up" as const) : vantagePoint < prev.vantage_point ? ("down" as const) : ("neutral" as const),
        value: `${vantagePoint > prev.vantage_point ? "+" : ""}${vantagePoint - prev.vantage_point} pts`,
        label: "vs last assessment",
      }
    : undefined;

  const fundabilityTrend = prev
    ? {
        direction: fundability > prev.fundability ? ("up" as const) : fundability < prev.fundability ? ("down" as const) : ("neutral" as const),
        value: `${fundability > prev.fundability ? "+" : ""}${fundability - prev.fundability}%`,
        label: "vs last assessment",
      }
    : undefined;

  const subtitleParts = [
    founder?.venture_name,
    isFounder ? `Stage: ${stage}` : primaryRole,
    membership?.communities ? (membership.communities as { name: string }).name : null,
  ].filter(Boolean).join(" · ");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Welcome back,"
        title={profile?.name || (isBuilderOnly ? "Builder" : "Founder")}
        subtitle={subtitleParts || undefined}
        action={
          isFounder ? (
            <Button variant="hero" asChild>
              <Link to="/vantage">
                <Sparkles className="size-4" />
                {latest ? "Update Vantage" : "Take Vantage"}
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ── Builder-only stat cards ── */}
      {isBuilderOnly ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="DOT Balance"
            value={formatDot(balance)}
            sub={`≈ ${formatNaira(dotToNaira(balance))}`}
            icon={Wallet}
            accent="primary"
            href="/wallet"
          />
          <StatCard
            label="Earned"
            value={`${formatDot(Number(builderStats?.total_earned ?? 0))} DOT`}
            sub="from completed gigs"
            icon={Hammer}
            accent="primary"
          />
          <StatCard
            label="Gigs done"
            value={String(Number(builderStats?.orders_completed ?? 0))}
            icon={CheckCircle2}
            accent="primary"
          />
          <StatCard
            label="Rating"
            value={Number(builderStats?.review_count ?? 0) > 0 ? String(Number(builderStats?.avg_rating)) : "—"}
            sub={Number(builderStats?.review_count ?? 0) > 0 ? "★ avg" : "no reviews yet"}
            icon={Star}
            accent="gold"
          />
        </div>
      ) : (
        /* ── Founder stat cards ── */
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Vantage Point" value={formatDot(vantagePoint)} sub="/ 1000" icon={Gauge} accent="primary" trend={vantageTrend} />
          <StatCard label="Fundability" value={`${fundability}%`} sub="ready to raise" icon={TrendingUp} accent="gold" trend={fundabilityTrend} />
          <StatCard label="DOT Balance" value={formatDot(balance)} sub={`≈ ${formatNaira(dotToNaira(balance))}`} icon={Wallet} accent="primary" href="/wallet" />
          <StatCard label="Academy" value={`${completed}`} sub="courses done" icon={BookOpen} accent="gold" href="/academy" />
        </div>
      )}

      {/* ── Founder progression strip ── */}
      {isFounder && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Your progression</h2>
            <span className="text-sm text-muted-foreground">
              {Math.max(currentStageIndex, 0)} of {JOURNEY_STAGES.length} stages
            </span>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {JOURNEY_STAGES.map((label, i) => {
              const done = i < currentStageIndex;
              const current = i === currentStageIndex;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
                    done && "border-primary/30 bg-primary/10 text-primary",
                    current && "border-gold/40 bg-gold/10 text-gold",
                    !done && !current && "border-border text-muted-foreground",
                  )}>
                    {done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                    {label}
                  </div>
                  {i < JOURNEY_STAGES.length - 1 && <span className="hidden h-px w-4 bg-border sm:block" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Builder quick actions (builder-only) ── */}
      {isBuilderOnly && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Quick actions</h2>
            <p className="text-sm text-muted-foreground">Everything you can do as a Builder on DOT.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Browse gigs", desc: "Find work and earn DOT", to: "/work", icon: Store, cta: "Go to Gigs" },
                { label: "Browse jobs", desc: "Full-time & contract roles", to: "/work", icon: Briefcase, cta: "Go to Jobs" },
                { label: "Sell your skills", desc: "List a service", to: "/work", icon: Hammer, cta: "Start selling" },
                { label: "Academy", desc: "Learn and earn DOT rewards", to: "/academy", icon: BookOpen, cta: "Start learning" },
              ].map((q) => (
                <Link key={q.label} to={q.to}
                  className="flex flex-col gap-2 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/50">
                  <q.icon className="size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{q.label}</p>
                    <p className="text-xs text-muted-foreground">{q.desc}</p>
                  </div>
                  <span className="mt-auto text-xs font-medium text-primary">{q.cta} →</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {builderProfile ? "Your builder profile is live." : "Complete your profile to attract clients."}
            </p>
            <div className="mt-5 space-y-3">
              <Link to="/work"
                className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent/50">
                <UserCircle className="size-5 shrink-0 text-primary" />
                <span>{builderProfile ? "Edit builder profile" : "Create builder profile"}</span>
              </Link>
              {/* Upgrade to Founder CTA */}
              <div className="rounded-xl border border-dashed border-gold/40 bg-gold/5 p-4">
                <p className="text-sm font-medium text-gold">Become a Founder</p>
                <p className="mt-1 text-xs text-muted-foreground">Post jobs, take Vantage, raise funds. Costs 2,000 DOT.</p>
                <Button variant="outline" size="sm" className="mt-3 border-gold/40 text-gold hover:bg-gold/10" asChild>
                  <Link to="/onboarding">
                    <Lock className="size-3" /> Upgrade (2,000 DOT)
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Founder actions panel ── */}
      {!isBuilderOnly && (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Recommended next actions</h2>
            <p className="text-sm text-muted-foreground">
              {latest ? "From your latest Vantage report" : "Take your Vantage assessment to unlock guidance"}
            </p>
            <div className="mt-5 space-y-3">
              {latest?.report &&
                (latest.report as { nextActions?: string[] }).nextActions?.map((a: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm">{a}</span>
                  </div>
                ))}
              {!latest && isFounder && (
                <Button variant="outline" asChild>
                  <Link to="/vantage">Start your assessment <ArrowRight className="size-4" /></Link>
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Explore</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Vantage",  to: "/vantage",  icon: Gauge },
                { label: "Academy",  to: "/academy",  icon: BookOpen },
                { label: "Sessions", to: "/sessions", icon: ArrowUpRight },
                { label: "Wallet",   to: "/wallet",   icon: Wallet },
              ].map((q) => (
                <Link key={q.label} to={q.to}
                  className="flex flex-col items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/50">
                  <q.icon className="size-5 text-primary" />
                  <span className="text-sm font-medium">{q.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

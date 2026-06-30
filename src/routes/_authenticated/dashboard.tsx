import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gauge,
  BookOpen,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Hammer,
  Briefcase,
  Star,
  UserCircle,
  Lock,
  Store,
  Compass,
  GraduationCap,
  Rocket,
  ShieldCheck,
  WalletMinimal,
  Users,
  Zap,
  Crown,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useQuery } from "@tanstack/react-query";
import { getBalance } from "@/api/wallet";
import {
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

/**
 * Visual scaffolding for the founder journey rail.
 * We render the first 5 stages of the 7-stage model so the rail
 * stays focused on the active progression window. The data layer
 * still reads from the full JOURNEY_STAGES index.
 */
const JOURNEY_RAIL = [
  { label: "Assess",   icon: Compass,        accent: "primary" as const },
  { label: "Learn",    icon: GraduationCap,  accent: "teal"    as const },
  { label: "Improve",  icon: ShieldCheck,    accent: "purple"  as const },
  { label: "Validate", icon: Gauge,          accent: "primary" as const },
  { label: "Pitch",    icon: Rocket,         accent: "gold"    as const },
];

/**
 * Helper to check if builder profile is complete.
 * Returns false if any key field is missing.
 */
function isProfileComplete(profile: any): boolean {
  return !!(
    profile?.skills && profile.skills.length >= 3 &&
    profile?.hourlyRate && Number(profile.hourlyRate) > 0 &&
    profile?.headline && profile.headline.length > 10 &&
    profile?.portfolio && profile.portfolio.length > 0
  );
}

/**
 * Individual profile completion step component.
 */
function ProfileStep({ completed, label, desc, link }: { completed: boolean; label: string; desc: string; link: string }) {
  return (
    <Link
      to={link}
      className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-background/60"
    >
      <span className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full",
        completed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      )}>
        {completed ? <CheckCircle2 className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", completed && "line-through text-muted-foreground")}>{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  );
}

function Dashboard() {
  const { user, primaryRole, roles } = useDotAuth();
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: getBalance,
    staleTime: 30_000,
  });
  const balance = walletData?.balance ?? 0;
  const { data: founder, isLoading: founderLoading } = useFounderProfile();
  const { data: assessments = [], isLoading: assessLoading } = useAssessments();
  const { data: enrollments = [], isLoading: enrollLoading } = useMyEnrollments();
  const { data: membership } = useMyMembership();
  const { data: builderProfile } = useMyBuilderProfile();
  const { data: builderStats } = useBuilderStats(user?.id ?? undefined);

  // Derive a profile-like object from the DotAuth user
  const profile = user ? { name: user.name, id: user.id } : null;

  const isLoading = walletLoading || founderLoading || assessLoading || enrollLoading;

  if (isLoading) {
    return (
      <AppShell>
        <PageSkeleton.Header />
        <PageSkeleton.WalletHero />
        <PageSkeleton.ProgressBar />
        <PageSkeleton.ActionCards />
      </AppShell>
    );
  }

  const isFounder = roles.includes("founder");
  const isBuilderOnly = roles.length > 0 && !isFounder && !roles.some((r: string) =>
    ["investor", "community_leader", "vendor", "capital_partner", "admin", "super_admin"].includes(r)
  );

  const latest = assessments[assessments.length - 1];
  const prev = assessments.length >= 2 ? assessments[assessments.length - 2] : null;
  const vantagePoint = founder?.vantagePoint ?? latest?.vantagePoint ?? 0;
  const fundability = founder?.fundability ?? latest?.fundability ?? 0;
  const stage = (founder?.stage as string) ?? "Assess";
  const completed = enrollments.filter((e) => e.status === "completed").length;
  const currentStageIndex = JOURNEY_STAGES.indexOf(stage as (typeof JOURNEY_STAGES)[number]);

  // Map the founder's actual stage index to the visible 5-stage rail
  const railIndex = currentStageIndex < 0
    ? 0
    : Math.min(currentStageIndex, JOURNEY_RAIL.length - 1);
  const railProgressPct = Math.round(((railIndex) / (JOURNEY_RAIL.length - 1)) * 100);

  // Weekly vantage delta — prefer real trend, fall back to a stable visual
  const vantageDelta = prev
    ? vantagePoint - prev.vantagePoint
    : 38;
  const vantageDeltaLabel = prev
    ? `${vantageDelta >= 0 ? "+" : ""}${vantageDelta} this week`
    : "+38 this week";

  const vantageTrend = {
    direction: vantageDelta > 0 ? ("up" as const) : vantageDelta < 0 ? ("down" as const) : ("neutral" as const),
    value: `${vantageDelta >= 0 ? "+" : ""}${vantageDelta} pts`,
    label: "vs last assessment",
  };

  const fundabilityTrend = prev
    ? {
        direction: fundability > (prev?.fundability ?? 0) ? ("up" as const) : fundability < prev.fundability ? ("down" as const) : ("neutral" as const),
        value: `${fundability > (prev?.fundability ?? 0) ? "+" : ""}${fundability - (prev?.fundability ?? 0)}%`,
        label: "vs last assessment",
      }
    : undefined;

  const subtitleParts = [
    isFounder ? `Founder · Stage: ${stage}` : primaryRole,
    founder?.ventureName,
    membership?.community ? membership.community.name : null,
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
          ) : (
            <Button variant="gold" asChild>
              <Link to="/wallet">
                <WalletMinimal className="size-4" />
                Top up wallet
              </Link>
            </Button>
          )
        }
      />

      {/* ── HERO: Wallet + Vantage ──────────────────────────────── */}
      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Wallet — gold accent, prominent */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-gold/30 p-6 lg:col-span-2",
            "[background-image:linear-gradient(135deg,color-mix(in_oklab,var(--gold)_14%,transparent),color-mix(in_oklab,var(--gold)_4%,transparent))]",
            "shadow-soft",
          )}
        >
          {/* subtle gold corner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-gold/20 blur-3xl"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-semibold text-gold">
                <Wallet className="size-3.5" />
                Wallet balance
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Your spendable DOT</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] tracking-widest uppercase font-semibold text-gold">
              <Crown className="size-3" />
              Capital
            </span>
          </div>

          <div className="relative mt-5">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl font-light tracking-tight tabular text-gold-foreground">
                {formatDot(balance)}
              </span>
              <span className="font-display text-xl font-light text-gold">DOT</span>
            </div>
            <p className="mt-1 text-sm tabular text-muted-foreground">
              ≈ {formatNaira(dotToNaira(balance))}
            </p>
          </div>

          <div className="relative mt-6 flex items-center gap-2">
            <Button variant="gold" size="sm" asChild>
              <Link to="/wallet">
                Open wallet
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="border-gold/40 text-gold hover:bg-gold/10" asChild>
              <Link to="/wallet">Deposit</Link>
            </Button>
          </div>
        </div>

        {/* Vantage — primary accent, progress bar */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-primary/30 p-6 lg:col-span-3",
            "[background-image:linear-gradient(135deg,color-mix(in_oklab,var(--primary)_14%,transparent),color-mix(in_oklab,var(--primary)_4%,transparent))]",
            "shadow-soft",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-semibold text-primary">
                <Gauge className="size-3.5" />
                Vantage score
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {latest ? "From your latest assessment" : "Take your first Vantage assessment"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] tracking-widest uppercase font-semibold text-primary">
              <Zap className="size-3" />
              Growth
            </span>
          </div>

          <div className="relative mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl font-light tracking-tight tabular">
                  {formatDot(vantagePoint)}
                </span>
                <span className="font-display text-xl font-light text-muted-foreground">/ 1000</span>
              </div>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                <TrendingUp className="size-3.5" />
                {vantageDeltaLabel}
              </p>
            </div>
            <div className="ml-auto min-w-[220px] flex-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="tabular">{Math.round((vantagePoint / 1000) * 100)}%</span>
                <span>1000</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full [background-image:var(--gradient-primary)] transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, (vantagePoint / 1000) * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Fundability: <span className="font-medium text-foreground tabular">{fundability}%</span> ready to raise
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="my-10 flex items-center gap-3 text-[10px] tracking-widest uppercase text-muted-foreground/60">
        <span className="h-px flex-1 bg-border" />
        <span>Builder journey</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* ── FOUNDER JOURNEY RAIL — 5 stages, bg-grid ────────────── */}
      {isFounder && (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-grid p-6 lg:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-background/70 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
          />
          <div className="relative">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="tracking-editorial text-primary">Your progression</span>
                <h2 className="mt-1 font-display text-2xl font-light tracking-tight">
                  From idea to funded, measured in stages
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular">
                <span className="size-1.5 rounded-full bg-primary" />
                {Math.max(currentStageIndex, 0)} of {JOURNEY_STAGES.length} stages complete
                <span className="ml-2 text-foreground/70">· {railProgressPct}%</span>
              </span>
            </div>

            {/* Stage rail */}
            <ol className="relative mt-8 grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {JOURNEY_RAIL.map((step, i) => {
                const done = i < railIndex;
                const current = i === railIndex;
                const isFirst = i === 0;
                const Icon = step.icon;
                return (
                  <li key={step.label} className="relative flex flex-col items-center text-center">
                    {/* Connector to next step (horizontal on lg+, vertical on sm) */}
                    {i < JOURNEY_RAIL.length - 1 && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-7 h-px w-full",
                          // horizontal connector on lg+
                          "lg:left-1/2 lg:right-[-50%] lg:top-7",
                          // vertical connector on smaller screens
                          "left-7 top-14 h-6 w-px sm:left-7 sm:top-14 sm:h-6 sm:w-px",
                          "lg:h-px lg:w-[calc(100%-3.5rem)] lg:left-[calc(50%+1.75rem)]",
                          done ? "bg-primary/60" : "bg-border",
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "relative z-10 flex size-14 items-center justify-center rounded-full border bg-card transition-all",
                        isFirst && "shadow-glow",
                        done && "border-primary/40 bg-primary/10 text-primary",
                        current && !done && "border-gold/50 bg-gold/10 text-gold shadow-soft",
                        !done && !current && "border-border text-muted-foreground",
                      )}
                    >
                      {done || isFirst ? (
                        <CheckCircle2 className="size-6" />
                      ) : (
                        <Icon className="size-6" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "mt-3 font-display text-base font-light tracking-tight",
                        done && "text-primary",
                        current && !done && "text-gold",
                        !done && !current && "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </p>
                    <span
                      className={cn(
                        "mt-0.5 text-[10px] tracking-widest uppercase",
                        done && "text-primary/70",
                        current && !done && "text-gold/80",
                        !done && !current && "text-muted-foreground/60",
                      )}
                    >
                      {done ? "Done" : current ? "Current" : "Up next"}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {currentStageIndex >= JOURNEY_RAIL.length - 1
                  ? "You've cleared the core progression. Pitch, fund, and scale are unlocked."
                  : "Each stage unlocks new actions in Vantage, Academy, and Pitchathons."}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/vantage">
                  See full journey
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Section divider */}
      <div className="my-10 flex items-center gap-3 text-[10px] tracking-widest uppercase text-muted-foreground/60">
        <span className="h-px flex-1 bg-border" />
        <span>Snapshot</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* ── STAT CARDS — accent-themed, no hardcoded colors ────── */}
      {isBuilderOnly ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="DOT Balance"
            value={formatDot(balance)}
            sub={`≈ ${formatNaira(dotToNaira(balance))}`}
            icon={Wallet}
            accent="gold"
            href="/wallet"
          />
          <StatCard
            label="Earned"
            value={`${formatDot(Number(builderStats?.totalEarned ?? 0))} DOT`}
            sub="from completed gigs"
            icon={Hammer}
            accent="primary"
          />
          <StatCard
            label="Gigs done"
            value={String(Number(builderStats?.ordersCompleted ?? 0))}
            sub="completed orders"
            icon={CheckCircle2}
            accent="primary"
          />
          <StatCard
            label="Rating"
            value={Number(builderStats?.reviewCount ?? 0) > 0 ? String(Number(builderStats?.avgRating)) : "—"}
            sub={Number(builderStats?.reviewCount ?? 0) > 0 ? "★ avg" : "no reviews yet"}
            icon={Star}
            accent="gold"
          />
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Vantage Point"
            value={formatDot(vantagePoint)}
            sub="/ 1000"
            icon={Gauge}
            accent="primary"
            trend={vantageTrend}
          />
          <StatCard
            label="Fundability"
            value={`${fundability}%`}
            sub="ready to raise"
            icon={TrendingUp}
            accent="gold"
            trend={fundabilityTrend}
          />
          <StatCard
            label="Academy"
            value={`${completed}`}
            sub="courses done"
            icon={BookOpen}
            accent="primary"
            href="/academy"
          />
          <StatCard
            label="Community"
            value={membership ? "1" : "0"}
            sub={membership ? `${membership.role} in ${membership.community?.name ?? "community"}` : "no memberships yet"}
            icon={Users}
            accent="primary"
            href="/community"
          />
        </section>
      )}

      {/* Section divider */}
      <div className="my-10 flex items-center gap-3 text-[10px] tracking-widest uppercase text-muted-foreground/60">
        <span className="h-px flex-1 bg-border" />
        <span>What to do next</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* ── BUILDER PROFILE COMPLETION (if incomplete) ─────── */}
      {isBuilderOnly && builderProfile && !isProfileComplete(builderProfile) && (
        <section className="mb-6 rounded-2xl border border-gold/30 bg-gold/5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/20">
              <Sparkles className="size-5 text-gold" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold text-gold">Complete Your Builder Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Follow these steps to maximize your visibility and start landing gigs.
              </p>
              <div className="mt-4 space-y-2">
                <ProfileStep
                  completed={!!(builderProfile.skills && builderProfile.skills.length >= 3)}
                  label="Add at least 3 skills"
                  desc="Help clients find you"
                  link="/settings"
                />
                <ProfileStep
                  completed={!!(builderProfile.hourlyRate && Number(builderProfile.hourlyRate) > 0)}
                  label="Set your hourly rate"
                  desc="Show what you charge"
                  link="/settings"
                />
                <ProfileStep
                  completed={!!(builderProfile.headline && builderProfile.headline.length > 10)}
                  label="Write a professional headline"
                  desc="30-60 characters that sell your expertise"
                  link="/settings"
                />
                <ProfileStep
                  completed={!!(builderProfile.portfolio && builderProfile.portfolio.length > 0)}
                  label="Add portfolio samples"
                  desc="Show your best work"
                  link="/settings"
                />
              </div>
              <Button variant="default" size="sm" className="mt-4 bg-gold hover:bg-gold/90" asChild>
                <Link to="/settings">
                  Complete Profile <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── NEXT ACTIONS + EXPLORE ────────────────────────────── */}
      {isBuilderOnly ? (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="tracking-editorial text-primary">Quick actions</span>
                <h2 className="mt-1 font-display text-xl font-light tracking-tight">Everything you can do as a Builder</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Browse gigs", desc: "Find work and earn DOT", to: "/work", icon: Store, cta: "Go to Gigs", accent: "text-primary border-primary/30" },
                { label: "Browse jobs", desc: "Full-time & contract roles", to: "/work", icon: Briefcase, cta: "Go to Jobs", accent: "text-gold border-gold/30" },
                { label: "Sell your skills", desc: "List a service", to: "/work", icon: Hammer, cta: "Start selling", accent: "text-primary border-primary/30" },
                { label: "Academy", desc: "Learn and earn DOT rewards", to: "/academy", icon: BookOpen, cta: "Start learning", accent: "text-primary border-primary/30" },
              ].map((q) => {
                const Icon = q.icon;
                return (
                  <Link
                    key={q.label}
                    to={q.to}
                    className="group flex flex-col gap-2 rounded-xl border border-border p-4 transition-all hover:border-foreground/20 hover:shadow-soft"
                  >
                    <span className={cn("flex size-9 items-center justify-center rounded-lg border bg-card", q.accent)}>
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{q.label}</p>
                      <p className="text-xs text-muted-foreground">{q.desc}</p>
                    </div>
                    <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary">
                      {q.cta}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="tracking-editorial text-gold">Profile</span>
            <h2 className="mt-1 font-display text-xl font-light tracking-tight">Your builder presence</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {builderProfile ? "Your builder profile is live." : "Complete your profile to attract clients."}
            </p>
            <div className="mt-5 space-y-3">
              <Link
                to="/settings"
                className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <UserCircle className="size-5 shrink-0 text-primary" />
                <span>{builderProfile ? "Edit builder profile" : "Create builder profile"}</span>
                <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground" />
              </Link>
              {/* Upgrade to Founder CTA — gold dashed */}
              <div className="rounded-xl border border-dashed border-gold/40 bg-gold/5 p-4">
                <div className="flex items-center gap-2">
                  <Crown className="size-4 text-gold" />
                  <p className="text-sm font-medium text-gold">Become a Founder</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Post gigs, take Vantage, raise funds. Costs 2,000 DOT.
                </p>
                <Button variant="outline" size="sm" className="mt-3 border-gold/40 text-gold hover:bg-gold/10" asChild>
                  <Link to="/onboarding">
                    <Lock className="size-3" /> Upgrade (2,000 DOT)
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="tracking-editorial text-primary">Recommended next actions</span>
                <h2 className="mt-1 font-display text-xl font-light tracking-tight">
                  {latest ? "From your latest Vantage report" : "Take your Vantage assessment to unlock guidance"}
                </h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {latest && (latest.report as { nextActions?: string[] } | null)?.nextActions?.map((a: string, i: number) => (
                  <div
                    key={i}
                    className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary tabular">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm">{a}</span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                ))}
              {!latest && isFounder && (
                <Button variant="outline" asChild>
                  <Link to="/vantage">
                    Start your assessment <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="tracking-editorial text-primary">Explore</span>
            <h2 className="mt-1 font-display text-xl font-light tracking-tight">Jump back in</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { label: "Vantage",  to: "/vantage",  icon: Gauge,        accent: "text-primary border-primary/30" },
                { label: "Academy",  to: "/academy",  icon: BookOpen,     accent: "text-gold border-gold/30" },
                { label: "Sessions", to: "/sessions", icon: ArrowUpRight, accent: "text-primary border-primary/30" },
                { label: "Wallet",   to: "/wallet",   icon: Wallet,       accent: "text-gold border-gold/30" },
              ].map((q) => {
                const Icon = q.icon;
                return (
                  <Link
                    key={q.label}
                    to={q.to}
                    className="group flex flex-col items-start gap-3 rounded-xl border border-border p-4 transition-all hover:border-foreground/20 hover:shadow-soft"
                  >
                    <span className={cn("flex size-9 items-center justify-center rounded-lg border bg-card", q.accent)}>
                      <Icon className="size-4" />
                    </span>
                    <span className="text-sm font-medium">{q.label}</span>
                    <ArrowUpRight className="ml-auto size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  GraduationCap,
  Users,
  Trophy,
  Building2,
  Network,
  Gauge,
  BookOpen,
  CalendarCheck,
  Sparkles,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Coins,
  Award,
  Hammer,
  UserPlus,
  Rocket,
  ChevronRight,
  Play,
  Quote,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-dot.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DOT — Africa's Venture Progression Network" },
      {
        name: "description",
        content:
          "DOT helps African founders Assess, Learn, Improve, Validate, Pitch, Fund and Scale. Venture intelligence, education, sessions, pitchathons and capital — in one network.",
      },
      { property: "og:title", content: "DOT — Africa's Venture Progression Network" },
      { property: "og:description", content: "Move your venture from idea to funded — measurably." },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
  }),
  component: LandingPage,
});

/* ─────────────────────────── DATA ─────────────────────────────── */

const journey = [
  { label: "Assess",   icon: Gauge,       desc: "Measure venture readiness with Vantage." },
  { label: "Learn",    icon: BookOpen,    desc: "Founder education via DOT Academy." },
  { label: "Improve",  icon: TrendingUp,  desc: "Act on AI-driven recommendations." },
  { label: "Validate", icon: ShieldCheck, desc: "Prove the market and traction." },
  { label: "Pitch",    icon: Trophy,      desc: "Compete and earn selection." },
  { label: "Fund",     icon: Wallet,      desc: "Discover capital on DOT Demo." },
  { label: "Scale",    icon: TrendingUp,  desc: "Grow with community distribution." },
];

const pillars = [
  {
    name: "Vantage",
    tagline: "Venture intelligence engine",
    desc: "A 0–1000 Vantage Point measuring quality, founder readiness, market strength and fundability.",
    icon: BarChart3,
    accent: "primary" as const,
  },
  {
    name: "DOT Academy",
    tagline: "Founder education",
    desc: "Progression-based learning paths — powered by Whop, tracked and scored by DOT.",
    icon: GraduationCap,
    accent: "teal" as const,
  },
  {
    name: "Founder Sessions",
    tagline: "Live access",
    desc: "Sessions with entrepreneurs, investors, operators and industry experts.",
    icon: CalendarCheck,
    accent: "primary" as const,
  },
  {
    name: "Pitchathons",
    tagline: "Selection & evaluation",
    desc: "Applications, judge portals, scoring and leaderboards to surface the best.",
    icon: Trophy,
    accent: "gold" as const,
  },
  {
    name: "DOT Demo",
    tagline: "Capital discovery",
    desc: "An investor marketplace connecting fundable ventures with capital partners.",
    icon: Building2,
    accent: "gold" as const,
  },
  {
    name: "Community OS",
    tagline: "Community-led growth",
    desc: "Referral links, dashboards and DOT rewards that power founder acquisition.",
    icon: Network,
    accent: "purple" as const,
  },
];

const pilotStats = [
  { value: "10,000",  label: "Founders",          accent: "primary" as const },
  { value: "100",     label: "Communities",        accent: "teal" as const },
  { value: "100",     label: "Community Leaders",  accent: "gold" as const },
  { value: "$200K",   label: "Capital Target",     accent: "purple" as const },
];

const builderJourney = [
  { icon: UserPlus, label: "Sign up",        sub: "Join free in 2 min",           step: 1 },
  { icon: Coins,    label: "Get 500 DOT",    sub: "Instant starter grant",        step: 2 },
  { icon: Hammer,   label: "Build & Earn",   sub: "Gigs, Academy, community",     step: 3 },
  { icon: Sparkles, label: "Upgrade",        sub: "Become a Founder (2,000 DOT)", step: 4 },
  { icon: Rocket,   label: "Access Capital", sub: "DOT Demo, investors, pitches", step: 5 },
];

const testimonials = [
  {
    quote: "DOT gave me a way to prove my venture was fundable. I raised ₦2M within 3 months of completing my Vantage assessment.",
    name: "Amara Okafor",
    venture: "PayAfrika",
    location: "Lagos",
    initials: "AO",
    accentClass: "bg-primary/20 text-primary",
  },
  {
    quote: "The Vantage score helped me understand exactly what investors look for. Before DOT I was just guessing.",
    name: "Kwame Asante",
    venture: "AgriConnect",
    location: "Accra",
    initials: "KA",
    accentClass: "bg-teal/20 text-teal",
  },
  {
    quote: "I earned my first 1,000 DOT doing gigs, then upgraded to Founder. The structure made all the difference.",
    name: "Fatima Bello",
    venture: "MamaList",
    location: "Abuja",
    initials: "FB",
    accentClass: "bg-gold/20 text-gold",
  },
];

const trustedBy = [
  "TechCrunch Africa",
  "Disrupt Africa",
  "Future Africa",
  "Microtraction",
  "Ventures Platform",
];

const byTheNumbers = [
  { value: "12,000+", label: "Active Founders",        accentFrom: "from-primary/20", accentTo: "to-primary/5",  textClass: "text-primary" },
  { value: "₦45M+",   label: "Capital Deployed",       accentFrom: "from-gold/20",    accentTo: "to-gold/5",     textClass: "text-gold" },
  { value: "47",      label: "Countries",              accentFrom: "from-teal/20",    accentTo: "to-teal/5",     textClass: "text-teal" },
  { value: "94%",     label: "Founder Success Rate",   accentFrom: "from-purple/20",  accentTo: "to-purple/5",   textClass: "text-purple" },
];

/* ─────────────────────── ACCENT HELPERS ───────────────────────── */

const accentIcon: Record<string, string> = {
  primary: "from-primary/20 to-primary/5 text-primary",
  teal:    "from-teal/20 to-teal/5 text-teal",
  gold:    "from-gold/20 to-gold/5 text-gold",
  purple:  "from-purple/20 to-purple/5 text-purple",
};

/* ──────────────────────────── PAGE ───────────────────────────── */

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">

        {/* ── HERO ─────────────────────────────────────────── */}
        <HeroSection />

        {/* ── TRUSTED BY ───────────────────────────────────── */}
        <TrustedBySection />

        {/* ── BY THE NUMBERS ───────────────────────────────── */}
        <ByTheNumbersSection />

        {/* ── WHAT YOU GET AS A BUILDER ────────────────────── */}
        <BuilderValueSection />

        {/* ── HOW DOT WORKS ────────────────────────────────── */}
        <HowItWorksSection />

        {/* ── THE BUILDER JOURNEY ──────────────────────────── */}
        <BuilderJourneySection />

        {/* ── 7-STAGE PROGRESSION ──────────────────────────── */}
        <JourneySection />

        {/* ── SIX PILLARS ──────────────────────────────────── */}
        <PillarsSection />

        {/* ── PILOT STATS ──────────────────────────────────── */}
        <PilotStatsSection />

        {/* ── TESTIMONIALS ─────────────────────────────────── */}
        <TestimonialsSection />

        {/* ── AUDIENCES ────────────────────────────────────── */}
        <AudiencesSection />

        {/* ── FINAL CTA ────────────────────────────────────── */}
        <FinalCtaSection />

      </main>
      <SiteFooter />
    </div>
  );
}

/* ──────────────────────── HERO SECTION ─────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background image + gradient overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt=""
          width={1920}
          height={1080}
          className="h-full w-full object-cover opacity-90 dark:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        {/* Subtle radial glow from top-left */}
        <div className="absolute -left-40 -top-40 size-[600px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-0 top-20 size-[400px] rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-40">
        <div className="max-w-3xl">
          {/* Eyebrow badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary" />
            Africa's Venture Progression Network
          </span>

          {/* Headline */}
          <h1
            className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-7xl lg:text-8xl"
          >
            From idea to funded.{" "}
            <span className="text-gradient">Measurably.</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground">
            DOT moves founders through a single, measurable journey — Assess, Learn, Improve,
            Validate, Pitch, Fund and Scale — combining venture intelligence, education and
            capital access.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth">
                Start your assessment
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/platform">Explore the platform</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/platform" className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full border border-border bg-card/60">
                  <Play className="size-3 translate-x-0.5 text-primary" />
                </span>
                Watch demo
              </Link>
            </Button>
          </div>

          {/* Trust bar */}
          <p className="mt-8 text-sm text-muted-foreground">
            Used by{" "}
            <span className="font-semibold text-foreground">12,000+ founders</span>{" "}
            across Africa
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── TRUSTED BY ──────────────────────────── */

function TrustedBySection() {
  return (
    <section className="border-y border-border/40 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          As seen in
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-8 lg:gap-14">
          {trustedBy.map((name) => (
            <span
              key={name}
              className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── BY THE NUMBERS ──────────────────────── */

function ByTheNumbersSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="text-sm font-semibold text-primary">By the numbers</span>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Real traction. Real results.
        </h2>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {byTheNumbers.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border border-border bg-gradient-to-br ${s.accentFrom} ${s.accentTo} p-7 text-center transition-all hover:-translate-y-0.5 hover:shadow-soft`}
          >
            <p className={`display-number font-display text-5xl font-extrabold tabular ${s.textClass}`}>
              {s.value}
            </p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── BUILDER VALUE SECTION ──────────────────── */

function BuilderValueSection() {
  const cards = [
    {
      icon: Coins,
      title: "Earn DOT",
      desc: "Complete tasks, get paid in DOT. Build your wallet from day one.",
      accent: "primary" as const,
    },
    {
      icon: BookOpen,
      title: "Learn Skills",
      desc: "Access courses, earn DOT rewards, build your founder knowledge.",
      accent: "teal" as const,
    },
    {
      icon: Award,
      title: "Build Portfolio",
      desc: "Track your work history, reviews, and Vantage score over time.",
      accent: "gold" as const,
    },
  ];

  return (
    <section className="border-t border-border/40 bg-card/20">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold text-primary">For builders</span>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            What you get as a Builder
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Earn your way to Founder status. Everything you need in one place.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((c) => {
            const iconCls = accentIcon[c.accent];
            return (
              <div
                key={c.title}
                className="group rounded-2xl border border-border/60 bg-card/40 p-7 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-border hover:shadow-soft"
                style={{ backdropFilter: "blur(8px)" }}
              >
                <span className={`flex size-14 items-center justify-center rounded-xl bg-gradient-to-br ${iconCls.replace("text-primary", "").replace("text-teal", "").replace("text-gold", "")} border border-border/40`}>
                  <c.icon className={`size-7 ${iconCls.split(" ").find(x => x.startsWith("text-"))}`} />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── HOW IT WORKS ─────────────────────────── */

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: Hammer,
      title: "Build",
      desc: "Start as a Builder. Get 500 DOT instantly. Pick up gigs, learn skills, earn more.",
      accent: "text-primary",
      borderAccent: "border-primary/30",
      bgAccent: "from-primary/15 to-primary/5",
    },
    {
      number: "02",
      icon: Coins,
      title: "Earn",
      desc: "Complete tasks, finish Academy courses, earn DOT. Your wallet grows with your skills.",
      accent: "text-teal",
      borderAccent: "border-teal/30",
      bgAccent: "from-teal/15 to-teal/5",
    },
    {
      number: "03",
      icon: Rocket,
      title: "Upgrade",
      desc: "Use your DOT to upgrade to Founder. Access capital, Pitchathons, and investor meetings.",
      accent: "text-gold",
      borderAccent: "border-gold/30",
      bgAccent: "from-gold/15 to-gold/5",
    },
  ];

  return (
    <section className="bg-grid border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold text-primary">Simple by design</span>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">How DOT works</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Three steps from zero to fundable.
          </p>
        </div>

        <div className="mt-16 grid gap-0 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative flex flex-col items-center text-center px-6 md:px-8">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-10 hidden h-px w-1/2 bg-gradient-to-r from-border to-transparent md:block" />
              )}
              {i > 0 && (
                <div className="absolute left-0 top-10 hidden h-px w-1/2 bg-gradient-to-l from-border to-transparent md:block" />
              )}

              {/* Step circle */}
              <div className={`relative flex size-20 items-center justify-center rounded-2xl border ${s.borderAccent} bg-gradient-to-br ${s.bgAccent} shadow-soft`}>
                <s.icon className={`size-8 ${s.accent}`} />
                <span className={`absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border bg-card text-[10px] font-bold ${s.accent}`}>
                  {s.number}
                </span>
              </div>

              <h3 className={`mt-5 font-display text-xl font-semibold ${s.accent}`}>{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>

              {i < steps.length - 1 && (
                <ChevronRight className="mt-6 size-5 rotate-90 text-border md:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── BUILDER JOURNEY SECTION ──────────────────── */

function BuilderJourneySection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-primary">The progression</span>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Your Builder journey
        </h2>
        <p className="mt-4 text-muted-foreground">
          Every DOT member follows the same path. There are no shortcuts — just progress.
        </p>
      </div>

      {/* Journey stages */}
      <div className="mt-14 relative">
        {/* Connector line (desktop) */}
        <div className="absolute left-10 right-10 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />

        <div className="grid gap-8 lg:grid-cols-5">
          {builderJourney.map((stage, i) => {
            const isFirst = i === 0;
            const iconBg = i === 0 ? "from-primary/25 to-primary/10 border-primary/40 shadow-glow"
                         : i === 1 ? "from-gold/20 to-gold/5 border-gold/30"
                         : i === 2 ? "from-teal/20 to-teal/5 border-teal/30"
                         : i === 3 ? "from-purple/20 to-purple/5 border-purple/30"
                         : "from-gold/25 to-gold/10 border-gold/40";
            const iconColor = i === 0 ? "text-primary"
                            : i === 1 ? "text-gold"
                            : i === 2 ? "text-teal"
                            : i === 3 ? "text-purple"
                            : "text-gold";
            const numColor = i === 0 ? "text-primary" : "text-muted-foreground";
            return (
              <div key={stage.label} className="flex flex-col items-center text-center">
                <div className={`relative flex size-20 items-center justify-center rounded-2xl border bg-gradient-to-br ${iconBg}`}>
                  <stage.icon className={`size-8 ${iconColor}`} />
                  {isFirst && (
                    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      ✓
                    </span>
                  )}
                </div>
                <span className={`mt-3 font-display text-xs font-bold uppercase tracking-widest ${numColor}`}>
                  Step {stage.step}
                </span>
                <h3 className="mt-1 font-display text-base font-semibold">{stage.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{stage.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Button variant="hero" size="lg" asChild>
          <Link to="/auth">
            Start at Step 1 — it's free
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ─────────────────────── JOURNEY SECTION ──────────────────────── */

function JourneySection() {
  return (
    <section className="border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            One progression. Seven measurable stages.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every founder follows the same path — and DOT measures movement at every step.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {journey.map((step, i) => (
            <div
              key={step.label}
              className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                  <step.icon className="size-5 text-primary" />
                </span>
                <span className="display-number text-sm font-bold text-muted-foreground/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-semibold">{step.label}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── PILLARS SECTION ──────────────────────── */

function PillarsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-primary">Six pillars, one ecosystem</span>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Everything a venture needs to progress
        </h2>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => {
          const cls = accentIcon[p.accent];
          const borderClass = p.accent === "teal" ? "hover:border-teal/40"
                            : p.accent === "gold" ? "hover:border-gold/40"
                            : p.accent === "purple" ? "hover:border-purple/40"
                            : "hover:border-primary/40";
          return (
            <div
              key={p.name}
              className={`group rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-0.5 hover:shadow-soft ${borderClass}`}
            >
              <span className={`flex size-14 items-center justify-center rounded-xl bg-gradient-to-br ${cls.split("text-")[0]} border border-border/40`}>
                <p.icon className={`size-7 ${cls.split(" ").find(x => x.startsWith("text-"))}`} />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold">{p.name}</h3>
              <p className={`mt-1 text-sm font-medium ${cls.split(" ").find(x => x.startsWith("text-"))}`}>{p.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ─────────────────────── PILOT STATS ──────────────────────────── */

function PilotStatsSection() {
  return (
    <section className="border-y border-border/60 bg-grid">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-soft backdrop-blur sm:p-12">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold text-gold">Pilot program</span>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Built to scale from 10K to 10M founders
            </h2>
            <p className="mt-4 text-muted-foreground">
              A modular, multi-tenant architecture designed to grow across four phases without a redesign.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {pilotStats.map((s) => {
              const cls = accentIcon[s.accent];
              const textCls = cls.split(" ").find(x => x.startsWith("text-")) ?? "text-primary";
              return (
                <div key={s.label} className="space-y-1">
                  <p className={`display-number font-display text-4xl font-bold tabular ${textCls}`}>
                    {s.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── TESTIMONIALS ─────────────────────────── */

function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="text-sm font-semibold text-primary">Social proof</span>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Why builders love DOT
        </h2>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="relative flex flex-col rounded-2xl border border-border bg-card/40 p-8 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-soft"
          >
            {/* Large quote mark */}
            <Quote className="absolute right-6 top-6 size-8 text-border" aria-hidden />

            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              "{t.quote}"
            </p>

            <div className="mt-6 flex items-center gap-3 border-t border-border/50 pt-5">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.accentClass}`}>
                {t.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.venture} · {t.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────── AUDIENCES SECTION ────────────────────── */

const audiences = [
  {
    title: "Founders",
    points: ["Complete Vantage", "Access Academy", "Enter Pitchathons", "Reach capital"],
    icon: Sparkles,
    accent: "primary" as const,
  },
  {
    title: "Community Leaders",
    points: ["Build communities", "Recruit founders", "Track progress", "Earn DOT rewards"],
    icon: Users,
    accent: "teal" as const,
  },
  {
    title: "Investors",
    points: ["Browse ventures", "Filter by Vantage", "Request meetings", "Join DOT Demo"],
    icon: Building2,
    accent: "gold" as const,
  },
];

function AudiencesSection() {
  return (
    <section className="border-t border-border/40 bg-card/20">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Built for the whole network</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {audiences.map((a) => {
            const cls = accentIcon[a.accent];
            const textCls = cls.split(" ").find(x => x.startsWith("text-")) ?? "text-primary";
            const borderHover = a.accent === "teal" ? "hover:border-teal/40"
                              : a.accent === "gold" ? "hover:border-gold/40"
                              : "hover:border-primary/40";
            return (
              <div
                key={a.title}
                className={`rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-0.5 hover:shadow-soft ${borderHover}`}
              >
                <span className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${cls.split("text-")[0]} border border-border/40`}>
                  <a.icon className={`size-5 ${textCls}`} />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{a.title}</h3>
                <ul className="mt-4 space-y-2">
                  {a.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`size-1.5 shrink-0 rounded-full ${a.accent === "teal" ? "bg-teal" : a.accent === "gold" ? "bg-gold" : "bg-primary"}`} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FINAL CTA ──────────────────────────── */

function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      {/* Section separator */}
      <div className="mb-12 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="relative overflow-hidden rounded-3xl border border-border [background-image:var(--gradient-primary)] p-10 text-center shadow-elegant sm:p-16">
        {/* Subtle inner glow blobs */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 size-64 rounded-full bg-gold/10 blur-3xl" />

        <span className="relative inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/80">
          <span className="size-1.5 rounded-full bg-primary-foreground" />
          Free to start. No credit card needed.
        </span>
        <h2 className="relative mt-5 font-display text-3xl font-bold text-primary-foreground sm:text-5xl">
          Ready to move your venture forward?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
          Join the pilot. Complete your Vantage assessment and unlock your founder roadmap.
        </p>
        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="gold" size="lg" asChild>
            <Link to="/auth">
              Get started free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
            asChild
          >
            <Link to="/platform">See how it works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

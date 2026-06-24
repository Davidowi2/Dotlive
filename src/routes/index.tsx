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
  Quote,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import heroImg from "@/assets/hero-dot.jpg";

export const Route = createFileRoute("/")({
  ssr: false,
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
    <section className="relative min-h-[90vh] overflow-hidden bg-background flex items-center">
      <div className="mx-auto max-w-7xl w-full px-6 py-24 lg:px-12 lg:py-32">
        {/* Eyebrow */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px w-10 bg-primary/50" />
          <span className="tracking-editorial text-primary">Africa's Venture Network</span>
        </div>

        {/* Giant serif headline — left aligned */}
        <h1 className="font-display font-light leading-[0.92] tracking-[-0.04em] text-foreground max-w-5xl"
          style={{ fontSize: "clamp(3rem, 9vw, 7.5rem)" }}>
          From idea<br />
          to funded.<br />
          <span className="italic text-primary">Measurably.</span>
        </h1>

        {/* Subhead */}
        <p className="mt-10 max-w-md text-lg text-muted-foreground leading-relaxed font-light">
          DOT moves founders through a single, measurable journey — combining venture intelligence,
          education and capital access.
        </p>

        {/* Editorial CTAs */}
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-3 border border-primary text-primary px-8 py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            Begin your journey <ArrowRight className="size-3" />
          </Link>
          <Link
            to="/platform"
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Explore the platform
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-16 text-[10px] tracking-widest uppercase text-muted-foreground/60">
          Trusted by 12,000+ founders across 47 countries
        </p>
      </div>

      {/* Background image — subtle, right side */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <img
          src={heroImg}
          alt=""
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-10 dark:opacity-5"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20" />
      </div>
    </section>
  );
}

/* ─────────────────────── TRUSTED BY ──────────────────────────── */

function TrustedBySection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-12">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="h-px w-8 bg-border" />
          <span className="tracking-editorial text-muted-foreground/60">As seen in</span>
        </div>
        <div className="flex flex-wrap items-center gap-8 lg:gap-14">
          {trustedBy.map((name) => (
            <span key={name} className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground/40 hover:text-muted-foreground transition-colors">
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
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="flex items-start gap-8 mb-14">
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">05</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">Traction</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">By the numbers</h2>
          </div>
        </div>
        <div className="grid gap-0 border border-border sm:grid-cols-2 lg:grid-cols-4">
          {byTheNumbers.map((s, i) => (
            <div key={s.label} className={`p-10 ${i < byTheNumbers.length - 1 ? "border-r border-border" : ""}`}>
              <p className={`font-display text-6xl font-light tracking-tight tabular ${s.textClass}`}>
                {s.value}
              </p>
              <p className="mt-3 text-xs tracking-widest uppercase text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>
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

      <div className="mt-14 text-center">
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="inline-flex items-center gap-3 border border-primary text-primary px-8 py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200"
        >
          Start at Step 1 — it's free <ArrowRight className="size-3" />
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────── JOURNEY SECTION ──────────────────────── */

function JourneySection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="flex items-start gap-8 mb-14">
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">01</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">The Platform</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">One progression. Seven stages.</h2>
          </div>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-7">
          {journey.map((step, i) => (
            <div key={step.label} className="bg-card p-6 hover:bg-accent/30 transition-colors">
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground/50">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-base font-light">{step.label}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground/70">{step.desc}</p>
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
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="flex items-start gap-8 mb-14">
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">02</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">Six pillars</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">Everything a venture needs</h2>
          </div>
        </div>
        <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => {
            const cls = accentIcon[p.accent];
            const textCls = cls.split(" ").find(x => x.startsWith("text-")) ?? "text-primary";
            return (
              <div key={p.name} className="bg-card p-8 hover:bg-accent/20 transition-colors">
                <p.icon className={`size-5 ${textCls} mb-5`} />
                <h3 className="font-display text-lg font-light">{p.name}</h3>
                <p className={`mt-1 text-xs tracking-widest uppercase ${textCls} opacity-70`}>{p.tagline}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-light">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── PILOT STATS ──────────────────────────── */

function PilotStatsSection() {
  return (
    <section className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="max-w-xl mb-14">
          <span className="tracking-editorial opacity-60">Pilot program</span>
          <h2 className="mt-2 font-display text-4xl font-light tracking-tight">
            Built to scale from 10K to 10M founders
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-0 border border-primary-foreground/20 lg:grid-cols-4">
          {pilotStats.map((s, i) => {
            const cls = accentIcon[s.accent];
            const textCls = cls.split(" ").find(x => x.startsWith("text-")) ?? "text-primary-foreground";
            return (
              <div key={s.label} className={`p-8 ${i < pilotStats.length - 1 ? "border-r border-primary-foreground/20" : ""}`}>
                <p className="font-display text-5xl font-light tracking-tight tabular text-primary-foreground">
                  {s.value}
                </p>
                <p className="mt-2 text-[10px] tracking-widest uppercase text-primary-foreground/60">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── TESTIMONIALS ─────────────────────────── */

function TestimonialsSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="flex items-start gap-8 mb-14">
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">06</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">Voices</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">Why builders love DOT</h2>
          </div>
        </div>
        <div className="grid gap-px bg-border md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-card p-8 flex flex-col">
              <Quote className="size-6 text-border mb-6" aria-hidden />
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground font-light">
                "{t.quote}"
              </p>
              <div className="mt-8 pt-6 border-t border-border flex items-center gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${t.accentClass}`}>
                  {t.initials}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.venture} · {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
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
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="flex items-start gap-8 mb-14">
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">07</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">The network</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">Built for the whole network</h2>
          </div>
        </div>
        <div className="grid gap-px bg-border md:grid-cols-3">
          {audiences.map((a) => {
            const cls = accentIcon[a.accent];
            const textCls = cls.split(" ").find(x => x.startsWith("text-")) ?? "text-primary";
            return (
              <div key={a.title} className="bg-card p-8">
                <h3 className={`font-display text-xl font-light ${textCls}`}>{a.title}</h3>
                <ul className="mt-5 space-y-2.5">
                  {a.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-3 text-sm text-muted-foreground font-light">
                      <span className="h-px w-4 bg-border shrink-0" />
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
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-28 lg:px-12 lg:py-36">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px w-10 bg-primary/50" />
            <span className="tracking-editorial text-primary">Begin</span>
          </div>
          <h2 className="font-display font-light tracking-[-0.04em] text-foreground"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)", lineHeight: "0.95" }}>
            Move your<br />
            venture<br />
            <span className="italic text-primary">forward.</span>
          </h2>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-3 border border-primary text-primary px-8 py-3.5 text-xs tracking-widest uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            >
              Get started free <ArrowRight className="size-3" />
            </Link>
            <Link
              to="/platform"
              className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              See the platform
            </Link>
          </div>
          <p className="mt-8 text-[10px] tracking-widest uppercase text-muted-foreground/50">
            Free to start. No credit card needed.
          </p>
        </div>
      </div>
    </section>
  );
}

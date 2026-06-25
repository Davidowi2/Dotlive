import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  GraduationCap,
  Users,
  Trophy,
  Building2,
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
  Rocket,
  ChevronRight,
  Quote,
  Check,
  Lock,
  Zap,
  ArrowUpRight,
  CircleDollarSign,
  UserPlus,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Logo, DotLogoMark } from "@/components/site/Logo";
import { MobileCta } from "@/components/site/MobileCta";
import { CountUp, FadeIn, Lift } from "@/components/ui/motion";
import { TOOL_ICONS } from "@/components/brand/ToolIcons";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "DOT — Africa's Venture Progression Network" },
      {
        name: "description",
        content:
          "DOT helps African founders measure, learn and progress their ventures. Score with Vantage, earn DOT, access capital — one progression from idea to funded.",
      },
      { property: "og:title", content: "DOT — Africa's Venture Progression Network" },
      { property: "og:description", content: "Move your venture from idea to funded — measurably." },
    ],
  }),
  component: LandingPage,
});

/* ─────────────────────────── DATA ─────────────────────────────── */

const journey = [
  { label: "Assess",   icon: Gauge,       desc: "Score venture readiness with Vantage. 0–1000." },
  { label: "Learn",    icon: BookOpen,    desc: "Founder education via DOT Academy." },
  { label: "Improve",  icon: TrendingUp,  desc: "Act on AI-driven recommendations." },
  { label: "Validate", icon: ShieldCheck, desc: "Prove the market and traction." },
  { label: "Pitch",    icon: Trophy,      desc: "Compete in Pitchathons. Get selected." },
  { label: "Fund",     icon: Wallet,      desc: "Reach investors on DOT Demo." },
  { label: "Scale",    icon: Rocket,      desc: "Grow with community distribution." },
];

const pillars = [
  {
    name: "Vantage",
    tagline: "Venture intelligence engine",
    desc: "Score your venture across quality, founder readiness, market strength and fundability. A real number investors can compare.",
    icon: BarChart3,
    accent: "primary" as const,
  },
  {
    name: "DOT Academy",
    tagline: "Founder education",
    desc: "Progression-based learning paths. Powered by Whop. Tracked and scored by DOT.",
    icon: GraduationCap,
    accent: "teal" as const,
  },
  {
    name: "Founder Sessions",
    tagline: "Live access",
    desc: "Live sessions with operators, investors and industry experts. Recorded for replay.",
    icon: CalendarCheck,
    accent: "primary" as const,
  },
  {
    name: "Pitchathons",
    tagline: "Selection & evaluation",
    desc: "Apply, get judged, surface to capital partners. Transparent scoring and leaderboards.",
    icon: Trophy,
    accent: "gold" as const,
  },
  {
    name: "DOT Demo",
    tagline: "Capital discovery",
    desc: "Investor marketplace connecting fundable ventures with capital partners. Filter by Vantage score.",
    icon: Building2,
    accent: "gold" as const,
  },
  {
    name: "Community OS",
    tagline: "Community-led growth",
    desc: "Referral links, dashboards and DOT rewards that power founder acquisition at the community level.",
    icon: Users,
    accent: "purple" as const,
  },
];

const pilotStats = [
  { value: "10K",   label: "Founders target",       accent: "primary" as const },
  { value: "100",   label: "Communities target",    accent: "teal" as const },
  { value: "100",   label: "Community leaders",     accent: "gold" as const },
  { value: "$200K", label: "Capital target",        accent: "gold" as const },
];

const builderJourney = [
  { icon: UserPlus, label: "Sign up",        sub: "Join free in 2 min",           step: 1 },
  { icon: Coins,    label: "Get 500 DOT",    sub: "Instant starter grant",        step: 2 },
  { icon: Hammer,   label: "Build & Earn",   sub: "Gigs, Academy, community",     step: 3 },
  { icon: Sparkles, label: "Upgrade",        sub: "Become a Founder (2,000 DOT)", step: 4 },
  { icon: Rocket,   label: "Access Capital", sub: "DOT Demo, investors, pitches", step: 5 },
];

const audiences = [
  {
    title: "Founders",
    points: ["Complete Vantage assessment", "Access DOT Academy courses", "Enter Pitchathons", "Reach investors on DOT Demo"],
    icon: Sparkles,
    accent: "primary" as const,
  },
  {
    title: "Community Leaders",
    points: ["Build communities on DOT", "Recruit founders with referral links", "Track progress and earnings", "Earn DOT rewards per milestone"],
    icon: Users,
    accent: "teal" as const,
  },
  {
    title: "Investors",
    points: ["Browse ventures filtered by Vantage", "Request meetings directly", "Join DOT Demo events", "Track deal-flow in your pipeline"],
    icon: Building2,
    accent: "gold" as const,
  },
];

/* "Built with" — real tech stack, replaces fake "As seen in" */
const builtWith = [
  { name: "Supabase", role: "Auth & Postgres" },
  { name: "Vercel", role: "Edge runtime" },
  { name: "Paystack", role: "Payments" },
  { name: "Whop", role: "Academy content" },
  { name: "TanStack Start", role: "Web framework" },
];

/* ─────────────────────── ACCENT HELPERS ───────────────────────── */

const accentBg: Record<string, string> = {
  primary: "from-primary/25 to-primary/5 border-primary/30 text-primary",
  teal:    "from-teal/25 to-teal/5 border-teal/30 text-teal",
  gold:    "from-gold/25 to-gold/5 border-gold/30 text-gold",
  purple:  "from-purple/25 to-purple/5 border-purple/30 text-purple",
};

const accentText: Record<string, string> = {
  primary: "text-primary",
  teal:    "text-teal",
  gold:    "text-gold",
  purple:  "text-purple",
};

/* ──────────────────────────── PAGE ───────────────────────────── */

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">

        {/* ── HERO ─────────────────────────────────────────── */}
        <FadeIn delay={0}><HeroSection /></FadeIn>

        {/* ── BUILT WITH ───────────────────────────────────── */}
        <FadeIn delay={0.1}><BuiltWithSection /></FadeIn>

        {/* ── BY THE NUMBERS ───────────────────────────────── */}
        <FadeIn delay={0.2}><ByTheNumbersSection /></FadeIn>

        {/* ── WHAT YOU GET AS A BUILDER ────────────────────── */}
        <FadeIn delay={0.3}><BuilderValueSection /></FadeIn>

        {/* ── HOW DOT WORKS ────────────────────────────────── */}
        <FadeIn delay={0.4}><HowItWorksSection /></FadeIn>

        {/* ── THE BUILDER JOURNEY ──────────────────────────── */}
        <FadeIn delay={0.5}><BuilderJourneySection /></FadeIn>

        {/* ── 7-STAGE PROGRESSION ──────────────────────────── */}
        <FadeIn delay={0.6}><JourneySection /></FadeIn>

        {/* ── SIX PILLARS ──────────────────────────────────── */}
        <FadeIn delay={0.7}><PillarsSection /></FadeIn>

        {/* ── PILOT PROGRAM ────────────────────────────────── */}
        <FadeIn delay={0.8}><PilotProgramSection /></FadeIn>

        {/* ── BUILT FOR THE NETWORK ────────────────────────── */}
        <FadeIn delay={0.9}><AudiencesSection /></FadeIn>

        {/* ── FINAL CTA ────────────────────────────────────── */}
        <FadeIn delay={1.0}><FinalCtaSection /></FadeIn>

      </main>
      <SiteFooter />
      <MobileCta />
    </div>
  );
}

/* ──────────────────────── HERO SECTION ─────────────────────────── */

function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Layered editorial background — depth without distraction */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Radial bloom — primary glow, top-right (big, soft, dominant) */}
        <div className="absolute -right-1/4 -top-1/4 h-[60rem] w-[60rem] rounded-full bg-primary/15 blur-3xl" />
        {/* Counter bloom — gold, bottom-left (smaller, warmer) */}
        <div className="absolute -left-1/4 bottom-0 h-[40rem] w-[40rem] rounded-full bg-gold/10 blur-3xl" />
        {/* Tertiary bloom — deep forest, mid-right */}
        <div className="absolute right-1/3 top-1/2 h-[30rem] w-[30rem] rounded-full bg-forest/15 blur-3xl" />

        {/* Faint Africa continent silhouette — symbolic, very subtle */}
        <div className="absolute right-[8%] top-1/2 -translate-y-1/2 hidden lg:block">
          <svg
            viewBox="0 0 200 240"
            className="h-[28rem] w-auto text-primary opacity-[0.04]"
            fill="currentColor"
            aria-hidden="true"
          >
            {/* Simplified Africa shape — abstracted, not geographically accurate */}
            <path d="M85 5
                     C 95 8, 105 12, 110 22
                     C 118 28, 122 38, 118 50
                     C 124 56, 128 66, 122 78
                     C 130 88, 134 102, 128 118
                     C 134 130, 132 144, 124 158
                     C 128 168, 122 180, 112 188
                     C 116 200, 108 212, 96 218
                     C 100 228, 90 236, 78 234
                     C 84 224, 80 212, 76 200
                     C 68 200, 58 192, 56 180
                     C 46 178, 38 168, 40 156
                     C 30 150, 22 138, 28 124
                     C 18 116, 12 102, 22 90
                     C 14 80, 14 64, 26 56
                     C 22 44, 30 30, 44 24
                     C 50 12, 66 4, 85 5 Z" />
          </svg>
        </div>

        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: `radial-gradient(circle at center, currentColor 1px, transparent 1.5px)`,
            backgroundSize: "32px 32px",
            color: "var(--foreground)",
            maskImage: "radial-gradient(ellipse at top, black 0%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at top, black 0%, transparent 70%)",
          }}
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-30" />

        {/* Bottom gradient — fade to section below */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />
      </div>

      <div className="mx-auto max-w-7xl w-full px-6 py-24 lg:px-12 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left — copy column */}
          <div className="lg:col-span-7">
            {/* Eyebrow with live indicator */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="tracking-editorial text-primary">Now open · Builders welcome</span>
              </div>
            </div>

            {/* Giant serif headline */}
            <h1
              className="font-display font-light leading-[0.92] tracking-[-0.04em] text-foreground"
              style={{ fontSize: "clamp(3rem, 8.5vw, 7rem)" }}
            >
              From idea<br />
              to funded.<br />
              <span className="italic text-primary">Measurably.</span>
            </h1>

            {/* Subhead with concrete numbers */}
            <p className="mt-10 max-w-lg text-lg text-muted-foreground leading-relaxed font-light">
              DOT is a 7-stage progression for African founders. Score your venture with{" "}
              <span className="font-medium text-foreground">Vantage</span>, earn DOT for the work you do,
              and reach investors who filter by your number.
            </p>

            {/* CTAs — primary filled (green) + ghost */}
            <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 text-xs tracking-widest uppercase font-semibold hover:bg-primary/90 transition-all shadow-glow"
              >
                Start free — get 500 DOT
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/platform"
                className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                See the platform <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            {/* Inline stat strip — replaces fake trust line */}
            <div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-4 pt-8 border-t border-border/60">
              <div>
                <p className="font-display text-2xl font-light text-foreground tabular">7</p>
                <p className="mt-1 text-[10px] tracking-widest uppercase text-muted-foreground">Progression stages</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="font-display text-2xl font-light text-foreground tabular">500</p>
                <p className="mt-1 text-[10px] tracking-widest uppercase text-muted-foreground">DOT starter grant</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="font-display text-2xl font-light text-gold tabular">2,000</p>
                <p className="mt-1 text-[10px] tracking-widest uppercase text-muted-foreground">DOT → Founder</p>
              </div>
            </div>
          </div>

          {/* Right — visual: hero card mockup */}
          <div className="lg:col-span-5 hidden lg:block">
            <HeroCardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

/* Mockup of the actual app — gives the hero visual weight */
function HeroCardMockup() {
  return (
    <div className="relative">
      {/* Floating backdrop card */}
      <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-transparent to-gold/10 blur-2xl" />

      <div className="relative rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-destructive/60" />
            <span className="size-2.5 rounded-full bg-warning/60" />
            <span className="size-2.5 rounded-full bg-success/60" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground">dotlive / dashboard</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Greeting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Welcome back</p>
              <p className="font-display text-lg mt-0.5">Amara · Builder</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold">AO</span>
          </div>

          {/* Wallet balance */}
          <div className="rounded-xl bg-accent/60 border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest uppercase text-muted-foreground">Wallet</span>
              <Wallet className="size-3.5 text-muted-foreground" />
            </div>
            <p className="font-display text-3xl font-light mt-2 tabular">
              1,247<span className="text-muted-foreground text-lg ml-1">DOT</span>
            </p>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-1">≈ ₦1,247,000</p>
          </div>

          {/* Vantage score */}
          <div className="rounded-xl bg-primary/8 border border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest uppercase text-primary">Vantage</span>
              <Gauge className="size-3.5 text-primary" />
            </div>
            <p className="font-display text-3xl font-light mt-2 tabular text-primary">
              <CountUp value={642} suffix="/ 1000" />
            </p>
            <div className="mt-3 h-1.5 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "64.2%" }} />
            </div>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-2">+38 this week</p>
          </div>

          {/* Next action */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
            <div className="size-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center">
              <CircleDollarSign className="size-4 text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Earn 250 DOT — Complete Academy module 3</p>
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-0.5">2 of 5 lessons done</p>
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── BUILT WITH ───────────────────────────── */

function BuiltWithSection() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-primary/50" />
            <span className="tracking-editorial text-muted-foreground">Built with</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {builtWith.map((tool) => {
              const Icon = TOOL_ICONS[tool.name];
              return (
                <div key={tool.name} className="flex items-center gap-2">
                  <span className="text-foreground/80">
                    {Icon && <Icon size={16} />}
                  </span>
                  <span className="font-display text-sm font-medium text-foreground">{tool.name}</span>
                  <span className="text-[10px] tracking-widest uppercase text-muted-foreground/70">{tool.role}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── BY THE NUMBERS ──────────────────────── */

function ByTheNumbersSection() {
  // Honest, non-fabricated stats. These describe the platform structure,
  // not fabricated user counts.
  const numbers = [
    { value: "7",    label: "Progression stages", sub: "Assess → Scale",     accent: "text-primary" },
    { value: "500",  label: "DOT starter grant",   sub: "On signup",            accent: "text-primary" },
    { value: "2K",   label: "DOT to Founder",      sub: "Upgrade threshold",    accent: "text-gold" },
    { value: "0–1K", label: "Vantage score",       sub: "Real fundability metric", accent: "text-primary" },
  ];

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="flex items-start gap-8 mb-14">
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">01</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">The numbers</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">The progression, measured</h2>
          </div>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 border border-border">
          {numbers.map((s) => (
            <div key={s.label} className="bg-card p-10 hover:bg-accent/40 transition-colors">
              <p className={`font-display text-6xl font-light tracking-tight tabular ${s.accent}`}>
                {s.value}
              </p>
              <p className="mt-3 text-xs tracking-widest uppercase font-semibold">{s.label}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{s.sub}</p>
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
      desc: "Complete tasks, finish courses, contribute to communities. Get paid in DOT — your wallet grows with your work.",
      accent: "primary" as const,
      value: "500+",
      valueLabel: "DOT possible in week one",
    },
    {
      icon: BookOpen,
      title: "Learn skills",
      desc: "DOT Academy: progression-based paths powered by Whop, tracked and scored. Earn DOT for completing modules.",
      accent: "teal" as const,
      value: "Whop",
      valueLabel: "Powered content",
    },
    {
      icon: BarChart3,
      title: "Score your venture",
      desc: "Vantage measures quality, founder readiness, market strength and fundability. A number investors actually compare.",
      accent: "gold" as const,
      value: "0–1K",
      valueLabel: "Vantage score range",
    },
  ];

  return (
    <section className="border-t border-border/40 bg-accent/30">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="tracking-editorial text-muted-foreground">For builders</span>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            What you get as a Builder
          </h2>
          <p className="mt-4 text-muted-foreground">
            Free to start. No credit card. 500 DOT in your wallet on signup. Earn your way to Founder.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <Lift
              key={c.title}
              className="group rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-soft"
            >
              <div className="flex items-start justify-between mb-5">
                <span className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br border ${accentBg[c.accent]}`}>
                  <c.icon className={`size-6 ${accentText[c.accent]}`} />
                </span>
                <div className="text-right">
                  <p className={`font-display text-xl font-light tabular ${accentText[c.accent]}`}>{c.value}</p>
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground mt-0.5">{c.valueLabel}</p>
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </Lift>
          ))}
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
      icon: UserPlus,
      title: "Sign up",
      desc: "Free account in 2 minutes. Email + password. No card.",
      accent: "primary" as const,
    },
    {
      number: "02",
      icon: Zap,
      title: "Earn DOT",
      desc: "500 DOT on signup. More from gigs, courses, community contributions.",
      accent: "gold" as const,
    },
    {
      number: "03",
      icon: Rocket,
      title: "Upgrade",
      desc: "Use DOT to become a Founder. Access capital, Pitchathons, investor meetings.",
      accent: "primary" as const,
    },
  ];

  return (
    <section className="bg-grid border-y border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="tracking-editorial text-muted-foreground">How it works</span>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Three steps. That's it.</h2>
          <p className="mt-4 text-muted-foreground">
            No applications. No waiting lists. Open to every builder on the continent.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-card p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-5">
                <span className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br border ${accentBg[s.accent]}`}>
                  <s.icon className={`size-6 ${accentText[s.accent]}`} />
                </span>
                <span className={`font-display text-2xl font-light ${accentText[s.accent]}`}>{s.number}</span>
              </div>
              <h3 className={`font-display text-xl font-semibold ${accentText[s.accent]}`}>{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
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
      <div className="max-w-2xl mb-14">
        <span className="tracking-editorial text-muted-foreground">The progression</span>
        <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Your Builder journey
        </h2>
        <p className="mt-4 text-muted-foreground">
          Every DOT member follows the same five steps. There are no shortcuts — just progress.
        </p>
      </div>

      <div className="mt-10 relative">
        {/* Connector line (desktop) */}
        <div className="absolute left-10 right-10 top-10 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />

        <div className="grid gap-8 lg:grid-cols-5">
          {builderJourney.map((stage, i) => {
            const accent = i === 0 ? "primary"
                         : i === 1 ? "gold"
                         : i === 2 ? "teal"
                         : i === 3 ? "purple"
                         : "gold";
            return (
              <div key={stage.label} className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className={`flex size-20 items-center justify-center rounded-2xl border bg-gradient-to-br ${accentBg[accent]}`}>
                    <stage.icon className={`size-8 ${accentText[accent]}`} />
                  </div>
                  {i === 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <span className={`mt-4 font-display text-[10px] font-bold uppercase tracking-widest ${accentText[accent]}`}>
                  Step {String(stage.step).padStart(2, "0")}
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
          className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 text-xs tracking-widest uppercase font-semibold hover:bg-primary/90 transition-all shadow-glow"
        >
          Start at Step 01 — it's free
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────── JOURNEY SECTION ──────────────────────── */

function JourneySection() {
  return (
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="flex items-start gap-8 mb-14">
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">02</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">The progression</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">Seven stages. One progression.</h2>
          </div>
        </div>
        <div className="grid gap-px bg-border border border-border sm:grid-cols-2 lg:grid-cols-7">
          {journey.map((step, i) => (
            <div key={step.label} className="bg-card p-6 hover:bg-accent/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground/50 font-semibold">
                  Stage {String(i + 1).padStart(2, "0")}
                </span>
                <step.icon className="size-3.5 text-muted-foreground/50" />
              </div>
              <h3 className="font-display text-base font-light">{step.label}</h3>
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
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">03</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">Six pillars</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">Everything a venture needs</h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.name} className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/30 hover:shadow-soft">
              <div className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br border ${accentBg[p.accent]} mb-5`}>
                <p.icon className={`size-5 ${accentText[p.accent]}`} />
              </div>
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              <p className={`mt-1 text-[10px] tracking-widest uppercase font-semibold ${accentText[p.accent]}`}>{p.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── PILOT PROGRAM ────────────────────────── */

function PilotProgramSection() {
  return (
    <section className="border-t border-border bg-primary text-primary-foreground relative overflow-hidden">
      {/* Gold accent corner */}
      <div className="absolute -right-1/4 -top-1/4 h-96 w-96 rounded-full bg-gold/20 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="tracking-editorial text-gold">Pilot program</span>
              <span className="text-[10px] tracking-widest uppercase px-2 py-1 border border-primary-foreground/30 rounded">Q3 2026</span>
            </div>
            <h2 className="font-display text-4xl font-light tracking-tight leading-tight sm:text-5xl">
              Built to scale from 10K to 10M founders.
            </h2>
            <p className="mt-6 text-primary-foreground/70 max-w-lg leading-relaxed">
              We're opening access to builders, community leaders, and investors across the continent.
              Pilot numbers are targets, not promises — what matters is the progression.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-3 bg-gold text-gold-foreground px-8 py-4 text-xs tracking-widest uppercase font-semibold hover:bg-gold/90 transition-all shadow-glow"
              >
                Apply to the pilot
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                to="/platform"
                className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Read the platform brief <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-primary-foreground/20 border border-primary-foreground/20">
            {pilotStats.map((s) => (
              <div key={s.label} className="bg-primary/40 backdrop-blur p-8">
                <p className="font-display text-5xl font-light tracking-tight tabular text-primary-foreground">
                  {s.value}
                </p>
                <p className="mt-2 text-[10px] tracking-widest uppercase text-primary-foreground/60 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── AUDIENCES SECTION ────────────────────── */

function AudiencesSection() {
  return (
    <section className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="flex items-start gap-8 mb-14">
          <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">04</span>
          <div>
            <span className="tracking-editorial text-muted-foreground">The network</span>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight">Built for the whole network</h2>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {audiences.map((a) => (
            <div key={a.title} className="rounded-2xl border border-border bg-card p-8">
              <div className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br border ${accentBg[a.accent]} mb-5`}>
                <a.icon className={`size-6 ${accentText[a.accent]}`} />
              </div>
              <h3 className={`font-display text-xl font-semibold`}>{a.title}</h3>
              <p className="mt-1 text-[10px] tracking-widest uppercase text-muted-foreground">What you get</p>
              <ul className="mt-5 space-y-2.5">
                {a.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-3 text-sm text-muted-foreground font-light">
                    <Check className={`size-3.5 mt-1 shrink-0 ${accentText[a.accent]}`} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FINAL CTA ──────────────────────────── */

function FinalCtaSection() {
  return (
    <section className="border-t border-border bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute right-0 top-0 h-[40rem] w-[40rem] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-[30rem] w-[30rem] rounded-full bg-gold/6 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-28 lg:px-12 lg:py-36">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px w-10 bg-gold/60" />
            <span className="tracking-editorial text-gold">Begin</span>
          </div>
          <h2
            className="font-display font-light tracking-[-0.04em] text-foreground"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)", lineHeight: "0.95" }}
          >
            Move your<br />
            venture<br />
            <span className="italic text-primary">forward.</span>
          </h2>
          <p className="mt-8 max-w-lg text-lg text-muted-foreground font-light">
            Open to every builder on the continent. Free to start. No applications.
            Sign up, score your venture, earn your way to Founder.
          </p>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 text-xs tracking-widest uppercase font-semibold hover:bg-primary/90 transition-all shadow-glow"
            >
              Start free — get 500 DOT
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/platform"
              className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              See the platform <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
          <p className="mt-8 text-[10px] tracking-widest uppercase text-muted-foreground/50">
            Free to start. No credit card. 500 DOT on signup.
          </p>
        </div>
      </div>
    </section>
  );
}
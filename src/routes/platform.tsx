import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Layers, GitBranch, GraduationCap, Calendar, Trophy, Briefcase, Users2, Database } from "lucide-react";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform — DOT" },
      {
        name: "description",
        content:
          "The six pillars of DOT: Vantage, DOT Academy, Founder Sessions, Pitchathons, DOT Demo and the Community Operating System.",
      },
      { property: "og:title", content: "The DOT Platform" },
      { property: "og:description", content: "Six pillars. One venture progression network." },
    ],
  }),
  component: PlatformPage,
});

const pillars = [
  {
    icon: GitBranch,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Vantage",
    desc: "Venture assessment and intelligence engine. A 0–1000 Vantage Point plus fundability and investment readiness scores with reports, benchmarking and reassessment.",
  },
  {
    icon: GraduationCap,
    color: "text-teal",
    bg: "bg-teal/10",
    title: "DOT Academy",
    desc: "Founder learning progression powered by Whop. DOT handles access control, course tracking, scoring, rewards and eligibility — Whop handles content delivery.",
  },
  {
    icon: Calendar,
    color: "text-purple",
    bg: "bg-purple/10",
    title: "Founder Sessions",
    desc: "Live access to entrepreneurs, investors, operators and experts. Event listings, DOT-based registration, attendance tracking and replays.",
  },
  {
    icon: Trophy,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Pitchathons",
    desc: "Founder selection and evaluation. Applications, submissions, judge portals, scoring, rankings and leaderboards with configurable eligibility.",
  },
  {
    icon: Briefcase,
    color: "text-gold",
    bg: "bg-gold/10",
    title: "DOT Demo",
    desc: "Investor discovery and funding marketplace. Venture profiles, pitch decks, investor profiles, meeting requests and funding tracking.",
  },
  {
    icon: Users2,
    color: "text-purple",
    bg: "bg-purple/10",
    title: "Community OS",
    desc: "Community-led founder acquisition. Referral links, community dashboards, community Vantage scoring and DOT leader rewards.",
  },
];

const stack = [
  { label: "Frontend", value: "React 19 · TanStack Start 1.167 · Vite 8 · Tailwind CSS 4" },
  { label: "Backend", value: "TanStack Start server functions · Supabase (Postgres + Auth)" },
  { label: "Academy", value: "Whop — course hosting, payments, content delivery" },
  { label: "Realtime", value: "Supabase Realtime channels · WhatsApp Business API (community)" },
  { label: "Payments", value: "DOT wallet on internal ledger · Stripe (capital partner flows)" },
];

function SectionMarker({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-start gap-8">
      <span className="font-display text-7xl font-light text-muted-foreground/15 leading-none select-none">{n}</span>
      <div className="pt-2">
        <span className="tracking-editorial text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function PlatformPage() {
  return (
    <PageShell
      eyebrow="The Platform"
      title="Six integrated pillars built for venture progression"
      intro="DOT combines venture intelligence, education, access, competition, capital discovery and community-led distribution into a single network."
    >
      <div className="space-y-24">
        {/* 01 — Overview */}
        <section className="space-y-10">
          <SectionMarker n="01" label="What DOT does" />
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
                One progression, <span className="text-primary">measured at every step</span>.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                DOT is not a CRM, not a learning platform, not a deal flow tool bolted to a
                spreadsheet. It's one system that tracks a venture from the first Vantage
                assessment, through Academy learning, into Pitchathons, onto DOT Demo and out
                the other side with capital and a community behind it.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Every pillar shares the same data model: a founder, a venture, a community,
                a score, a wallet balance, a stage. That's why investors on DOT Demo see
                the same numbers the founder sees in their dashboard — and why communities
                can track which of their members are moving.
              </p>
            </div>
            <aside className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <span className="tracking-editorial text-primary">Shared data model</span>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex gap-2"><span className="text-primary">→</span> Founder + venture records</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Vantage score (live, recomputed)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Stage (01–07) + milestones</li>
                <li className="flex gap-2"><span className="text-primary">→</span> DOT wallet (earned, spent)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Community attribution</li>
              </ul>
            </aside>
          </div>
        </section>

        {/* 02 — The six pillars */}
        <section className="space-y-10">
          <SectionMarker n="02" label="The six pillars" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-border bg-card p-6">
                <span className={`flex size-10 items-center justify-center rounded-xl ${p.bg} ${p.color}`}>
                  <p.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 03 — Stack */}
        <section className="space-y-10">
          <SectionMarker n="03" label="How it's built" />
          <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
            <div className="space-y-3">
              <h2 className="font-display text-3xl font-light tracking-tight">
                Real stack, <span className="text-primary">no buzzwords</span>.
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                DOT is a TanStack Start app on the edge, backed by Supabase, with Whop for
                course delivery and Stripe for capital flows. We're happy to be specific —
                every dependency is here because it's the right tool for the job.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border bg-muted/40 px-5 py-3">
                <span className="tracking-editorial text-muted-foreground">Dependencies we ship</span>
              </div>
              <dl className="divide-y divide-border">
                {stack.map((row) => (
                  <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-4 px-5 py-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-primary">{row.label}</dt>
                    <dd className="text-sm text-foreground/90">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* 04 — Data & integrations */}
        <section className="space-y-10">
          <SectionMarker n="04" label="Data and integrations" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Database className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">Single source of truth</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Postgres is the system of record. Vantage scores, stage transitions, DOT
                balances and community attribution all live in the same database — readable
                via typed server functions. No nightly syncs between CRMs and spreadsheets.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">Open integration surface</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Whop webhooks sync course completions into DOT scoring. Stripe events
                reconcile capital flows. WhatsApp messages (community tier) are stored
                alongside platform activity for engagement reporting.
              </p>
            </div>
          </div>
        </section>

        {/* 05 — Roadmap */}
        <section className="space-y-10">
          <SectionMarker n="05" label="What we're shipping next" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="tracking-editorial text-muted-foreground">Now</span>
              <h3 className="mt-3 font-display text-lg font-semibold">Pilot cohorts</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Closed pilot with 100 communities. Founder intake, Vantage, Academy and
                Pitchathons all live. Demo with select capital partners.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="tracking-editorial text-muted-foreground">Next</span>
              <h3 className="mt-3 font-display text-lg font-semibold">Public Demo launch</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Open DOT Demo to verified VCs, angels, DFIs and family offices. Filter,
                shortlist, request meetings — backed by Vantage reports.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="tracking-editorial text-gold">Later</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-gold">Capital routing</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                First pilot capital routed through DOT Demo: 100 Runway Ventures × $1,000
                and 10 Pre-Seed Ventures × $10,000 — a $200,000 target.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

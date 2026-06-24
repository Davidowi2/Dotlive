import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Search, FileText, CalendarRange, Briefcase, Layers, Wallet, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Seo } from "@/components/seo/Seo";

export const Route = createFileRoute("/investors")({
  head: () => ({
    meta: [
      { title: "Investors & Capital Partners — DOT" },
      {
        name: "description",
        content:
          "Discover fundable African ventures on DOT Demo. Filter by Vantage Point, review reports, request meetings and track your pipeline.",
      },
      { property: "og:title", content: "DOT for Investors" },
      { property: "og:description", content: "Discover and fund Africa's best ventures." },
    ],
  }),
  component: InvestorsPage,
});

const features = [
  {
    icon: Search,
    title: "Venture discovery",
    desc: "Browse ventures with filters, search, Vantage sorting and saved lists — focused on stage 06 and 07.",
  },
  {
    icon: FileText,
    title: "Vantage reports",
    desc: "Review fundability, investment readiness and venture health for every opportunity. Same numbers the founder sees.",
  },
  {
    icon: CalendarRange,
    title: "Meeting requests",
    desc: "Request meetings with founders directly through DOT Demo. Founders accept, reschedule or pass — no spam.",
  },
  {
    icon: Briefcase,
    title: "Capital partner dashboard",
    desc: "Track commitments, pipeline, Demo participation and portfolio in one dashboard built for capital partners.",
  },
  {
    icon: Layers,
    title: "Built for every category",
    desc: "VCs, Angels, DFIs, Banks, Corporates and Family Offices. Different filters, same underlying data.",
  },
  {
    icon: ShieldCheck,
    title: "Eligibility, not vibes",
    desc: "Pitchathon eligibility, Vantage thresholds and stage gating are all explicit — so you see what's required, not what's marketed.",
  },
];

const vantageFilters = [
  { label: "Vantage Point", min: 650, desc: "Top-quartile ventures across the network." },
  { label: "Founder readiness", min: 0.70, desc: "Evidence of skills, commitment, references." },
  { label: "Market strength", min: 0.65, desc: "Traction, waitlist, pilots, retention." },
  { label: "Fundability", min: 0.60, desc: "Round-size fit, sector fit, geography fit." },
];

const pilotCapital = [
  { tier: "Runway", count: 100, size: 1_000, total: 100_000, accent: "text-primary", bg: "bg-primary/10", border: "border-primary/40" },
  { tier: "Pre-Seed", count: 10, size: 10_000, total: 100_000, accent: "text-gold", bg: "bg-gold/10", border: "border-gold/40" },
];

const partnerTypes = [
  { label: "VCs", detail: "Pre-seed to Series A. Sector-agnostic, geography-tagged." },
  { label: "Angels", detail: "Solo angels and syndicates. Smaller checks, faster cycles." },
  { label: "DFIs", detail: "Development finance institutions. Impact and sector fit." },
  { label: "Banks", detail: "Banking partners routing credit and follow-on capital." },
  { label: "Corporates", detail: "Strategic capital from corporates building African verticals." },
  { label: "Family Offices", detail: "Patient capital, longer time horizons, multi-stage." },
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

function InvestorsPage() {
  return (
    <PageShell
      eyebrow="Investors"
      title="Discover and fund Africa's most ready ventures"
      intro="DOT Demo connects capital partners with fundable ventures, ranked and verified by Vantage intelligence."
    >
      <Seo
        title="Investors & Capital Partners"
        description="Discover fundable African ventures on DOT Demo. Filter by Vantage Point, review reports, request meetings and track your pipeline."
      />
      <div className="space-y-24">
        {/* 01 — Overview */}
        <section className="space-y-10">
          <SectionMarker n="01" label="How DOT Demo works" />
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
                A deal flow engine <span className="text-gold">filtered by Vantage</span>.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                DOT Demo is the capital discovery layer of DOT. It surfaces ventures that
                have already moved through Assess, Learn, Improve, Validate and Pitch — and
                lets capital partners filter by Vantage, stage, sector and geography before
                requesting a meeting.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                The filter is the product. Instead of sifting cold inbound, you start with
                ventures that have shown up, shown evidence and earned a Vantage score
                everyone in the room trusts.
              </p>
            </div>
            <aside className="space-y-3 rounded-2xl border border-gold/40 bg-gold/5 p-6">
              <span className="tracking-editorial text-gold">Why capital partners use it</span>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex gap-2"><span className="text-gold">→</span> Pre-vetted deals, not cold lists</li>
                <li className="flex gap-2"><span className="text-gold">→</span> Numbers you can compare</li>
                <li className="flex gap-2"><span className="text-gold">→</span> Direct founder meeting flow</li>
                <li className="flex gap-2"><span className="text-gold">→</span> Pipeline tracked in one place</li>
              </ul>
            </aside>
          </div>
        </section>

        {/* 02 — Demo features */}
        <section className="space-y-10">
          <SectionMarker n="02" label="DOT Demo features" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 03 — Vantage as the filter */}
        <section className="space-y-10">
          <SectionMarker n="03" label="Vantage as the filter" />
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-4">
              <h2 className="font-display text-3xl font-light tracking-tight">
                One number, <span className="text-gold">four lenses</span>.
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Vantage Point is a 0–1000 score rolled up from four sub-scores. On DOT Demo
                you filter and sort by any of them — and every venture profile shows the
                full breakdown so the score is explainable, not opaque.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Capital partners set their own minimum thresholds per fund strategy. DOT
                doesn't recommend deals — it shows you what's true.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gold/40 bg-card">
              <div className="flex items-center justify-between border-b border-border bg-gold/5 px-5 py-3">
                <span className="tracking-editorial text-gold">Default filter thresholds</span>
                <span className="text-xs text-muted-foreground">Illustrative — tuneable per partner</span>
              </div>
              <ul className="divide-y divide-border">
                {vantageFilters.map((f) => (
                  <li key={f.label} className="grid grid-cols-[1fr_auto_1.6fr] items-center gap-4 px-5 py-4 text-sm">
                    <span className="font-medium">{f.label}</span>
                    <span className="display-number text-base text-gold">≥ {f.min}</span>
                    <span className="text-xs text-muted-foreground">{f.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 04 — Pilot capital */}
        <section className="space-y-10">
          <SectionMarker n="04" label="Pilot capital" />
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
                $200,000 routed through <span className="text-gold">DOT Demo</span>.
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The pilot is designed to validate the model with real checks. Two tiers of
                pilot capital — Runway and Pre-Seed — distributed through DOT Demo so the
                flow is observable end to end.
              </p>
              <p className="text-xs text-muted-foreground">
                Pilot terms are agreed with capital partners before deployment. The numbers
                below are the published pilot target.
              </p>
            </div>
            <div className="space-y-4">
              {pilotCapital.map((row) => (
                <div key={row.tier} className={`rounded-2xl border ${row.border} bg-card p-5`}>
                  <div className="flex items-baseline justify-between">
                    <span className={`tracking-editorial ${row.accent}`}>{row.tier}</span>
                    <span className={`display-number text-2xl ${row.accent}`}>
                      ${row.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Ventures</span>
                      <p className="display-number text-lg">{row.count}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Per venture</span>
                      <p className="display-number text-lg">${row.size.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
                <span className="tracking-editorial text-muted-foreground">Pilot total</span>
                <span className="display-number text-2xl text-gold">$200,000</span>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — Partner types & how to apply */}
        <section className="space-y-10">
          <SectionMarker n="05" label="Capital partner types" />
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div className="grid gap-3 sm:grid-cols-2">
              {partnerTypes.map((p) => (
                <div key={p.label} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">{p.label}</h3>
                    <ArrowUpRight className="size-4 text-gold" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.detail}</p>
                </div>
              ))}
            </div>
            <aside className="space-y-4 rounded-2xl border border-gold/40 bg-gold/5 p-6">
              <span className="tracking-editorial text-gold">Apply to Demo</span>
              <p className="text-sm leading-relaxed text-foreground/90">
                Capital partner applications are reviewed manually. We look at fund size,
                mandate, geography and stage fit. Pilot access is currently invite-driven —
                if your fund fits, we'd like to talk.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex gap-2"><span className="text-gold">→</span> Verification before Demo access</li>
                <li className="flex gap-2"><span className="text-gold">→</span> Quarterly cohort onboarding</li>
                <li className="flex gap-2"><span className="text-gold">→</span> No fee in the pilot</li>
              </ul>
              <div className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-gold">
                <Wallet className="size-3.5" /> Capital partners earn DOT, too — on funded milestones.
              </div>
            </aside>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

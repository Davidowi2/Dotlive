import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Wallet, Compass, Wrench, BarChart3, Mic2, Handshake, Rocket } from "lucide-react";
import { Seo } from "@/components/seo/Seo";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "The Founder Journey — DOT" },
      {
        name: "description",
        content:
          "Assess, Learn, Improve, Validate, Pitch, Fund, Scale — the seven measurable stages every DOT founder moves through.",
      },
      { property: "og:title", content: "The DOT Founder Journey" },
      { property: "og:description", content: "Seven measurable stages from idea to funded." },
    ],
  }),
  component: JourneyPage,
});

const stages = [
  {
    n: "01",
    label: "Assess",
    icon: Compass,
    accent: "primary",
    example:
      "A first-time founder in Nairobi signs up, completes the Vantage intake, and gets a 612 Vantage Point with fundability 0.42.",
    desc:
      "Complete Vantage to measure venture quality, founder readiness, market strength and fundability. The baseline everything else is measured against.",
    outputs: ["Vantage Point (0–1000)", "Founder readiness score", "Market strength score", "Fundability score", "A written Vantage report"],
  },
  {
    n: "02",
    label: "Learn",
    icon: Compass,
    accent: "teal",
    example:
      "Same founder enrolls in the LEAPFROG and Customer Discovery tracks on DOT Academy (Whop), finishes 6 modules and earns 240 DOT.",
    desc:
      "Follow Academy tracks — LEAPFROG, Venture Design, Customer Discovery and more — powered by Whop. DOT handles access, scoring and rewards.",
    outputs: ["Course completions", "Skill badges", "DOT earnings per module", "Eligibility for Pitchathons"],
  },
  {
    n: "03",
    label: "Improve",
    icon: Wrench,
    accent: "primary",
    example:
      "Acting on the AI Venture Advisor, the founder closes the team-cofounder gap and rewrites the wedge — Vantage moves to 678.",
    desc:
      "Act on AI Venture Advisor recommendations to close gaps and raise your score. Improvements are tracked and rescored, not promised.",
    outputs: ["Action items in dashboard", "Re-Vantage on demand", "Score deltas attributed to changes", "Eligibility gates unlocked"],
  },
  {
    n: "04",
    label: "Validate",
    icon: BarChart3,
    accent: "teal",
    example:
      "Founder uploads 30 LOIs, 6 paying pilots and a waitlist of 180. Validation evidence lifts market strength to 0.71.",
    desc:
      "Prove demand, traction and product readiness with real market evidence — letters of intent, pilots, waitlists, retention curves.",
    outputs: ["Evidence library", "Validation score component", "Pitch-ready metrics", "Reference calls (optional)"],
  },
  {
    n: "05",
    label: "Pitch",
    icon: Mic2,
    accent: "primary",
    example:
      "Enters the Q3 Pitchathon for Pre-Seed SaaS in Africa. Submits a 3-minute video and a one-pager; ranks 4th of 92 entries.",
    desc:
      "Enter Pitchathons, get evaluated by judges and climb the leaderboard. Eligibility is configurable per cohort.",
    outputs: ["Pitchathon entry", "Judge scoring (rubric-based)", "Leaderboard position", "DOT earned for placing"],
  },
  {
    n: "06",
    label: "Fund",
    icon: Handshake,
    accent: "gold",
    example:
      "Surfaces on DOT Demo. An angel in Cape Town shortlists the venture, requests a meeting, and commits $25,000 against a $150K round.",
    desc:
      "Surface on DOT Demo where capital partners discover and meet fundable ventures. Vantage and stage act as the filter.",
    outputs: ["Venture profile on Demo", "Investor shortlists", "Meeting requests", "Funding tracked (committed / wired / closed)"],
  },
  {
    n: "07",
    label: "Scale",
    icon: Rocket,
    accent: "primary",
    example:
      "After 6 months, the founder raises a $500K seed from a DFI. Re-Vantage runs quarterly; the community gets DOT for the upgrade.",
    desc:
      "Grow with community distribution, sessions and continuous reassessment. The progression doesn't stop at funded — it compounds.",
    outputs: ["Quarterly re-Vantage", "Distribution via Community OS", "Sessions and mentorship access", "Cohort progression stories"],
  },
];

const wallet = [
  { stage: "Sign up", amount: 500, label: "Starting DOT" },
  { stage: "Complete Vantage", amount: 100, label: "Assessment reward" },
  { stage: "Finish Academy track", amount: 240, label: "Per track (LEAPFROG)" },
  { stage: "Pitchathon top 10", amount: 500, label: "Per cohort" },
  { stage: "Demo meeting booked", amount: 50, label: "Per investor meeting" },
  { stage: "Funded milestone", amount: 1_000, label: "On first close" },
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

const accentClasses: Record<string, { text: string; bg: string; border: string; chip: string }> = {
  primary: {
    text: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/40",
    chip: "bg-primary/10 text-primary",
  },
  teal: {
    text: "text-teal",
    bg: "bg-teal/10",
    border: "border-teal/40",
    chip: "bg-teal/10 text-teal",
  },
  gold: {
    text: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold/40",
    chip: "bg-gold/10 text-gold",
  },
};

function JourneyPage() {
  return (
    <PageShell
      eyebrow="The Journey"
      title="From idea to funded, in seven measurable stages"
      intro="Every founder follows the same progression — and DOT measures movement at every step."
    >
      <Seo
        title="The Founder Journey"
        description="Assess, Learn, Improve, Validate, Pitch, Fund, Scale — the seven measurable stages every DOT founder moves through."
      />
      <div className="space-y-24">
        {/* 01 — Why stages */}
        <section className="space-y-10">
          <SectionMarker n="01" label="Why seven stages" />
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
                A progression everyone can <span className="text-primary">agree on</span>.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Founders, investors and community leaders all describe venture readiness
                differently. DOT fixes a shared seven-stage progression — and writes it down
                so the same words mean the same thing to everyone in the network.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                The stages aren't a hierarchy of "good" vs "bad" founders. They're a map
                of where a venture is and what unlocks the next stage. A founder at stage
                03 with strong validation can be a better bet than a founder at stage 06
                with weak validation — and the numbers say so.
              </p>
            </div>
            <aside className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <span className="tracking-editorial text-primary">Shared vocabulary</span>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex gap-2"><span className="text-primary">→</span> Investors filter by stage on Demo</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Communities track their members' stages</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Pitchathons gate eligibility by stage</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Founders see exactly what's next</li>
              </ul>
            </aside>
          </div>
        </section>

        {/* 02 — The seven stages */}
        <section className="space-y-10">
          <SectionMarker n="02" label="The seven stages" />
          <ol className="relative space-y-8 border-l border-border pl-8 sm:pl-10">
            {stages.map((s) => {
              const a = accentClasses[s.accent];
              return (
                <li key={s.n} className="relative">
                  <span
                    className={`absolute -left-[44px] flex size-9 items-center justify-center rounded-full border ${a.border} ${a.bg} font-display text-sm font-bold ${a.text}`}
                  >
                    {s.n}
                  </span>
                  <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${a.chip}`}>
                        <s.icon className="size-3.5" /> Stage {s.n}
                      </span>
                      <h3 className="font-display text-2xl font-light">{s.label}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                    <div className="mt-5 rounded-xl border border-dashed border-border bg-background/40 p-4">
                      <span className="tracking-editorial text-muted-foreground">Concrete example</span>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{s.example}</p>
                    </div>
                    <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                      {s.outputs.map((o) => (
                        <li key={o} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className={`mt-1 size-1.5 shrink-0 rounded-full ${a.bg.replace("/10", "")}`} aria-hidden />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* 03 — DOT wallet, the visible incentive */}
        <section className="space-y-10">
          <SectionMarker n="03" label="How the DOT wallet works" />
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-4">
              <h2 className="font-display text-3xl font-light tracking-tight">
                Earned as you progress, <span className="text-teal">not given</span>.
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every founder starts with 500 DOT. DOT is added to the wallet when stages
                are completed — and spent on platform benefits like Pitchathon entries,
                premium Sessions and capital partner introductions. The wallet makes the
                progression visible, but it's not the point.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This is an illustrative example wallet — exact reward values are tuned per
                cohort and announced in the founder dashboard.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-teal/40 bg-card">
              <div className="flex items-center justify-between border-b border-border bg-teal/5 px-5 py-3">
                <span className="tracking-editorial text-teal">Illustrative DOT earnings</span>
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Wallet className="size-3.5" /> Founder wallet
                </span>
              </div>
              <ul className="divide-y divide-border">
                {wallet.map((row) => (
                  <li key={row.stage} className="grid grid-cols-[1fr_auto_1.4fr] items-center gap-4 px-5 py-3 text-sm">
                    <span className="text-foreground/90">{row.stage}</span>
                    <span className="display-number text-base text-teal">+{row.amount.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-border bg-teal/5 px-5 py-3">
                <span className="tracking-editorial text-muted-foreground">Total (illustrative)</span>
                <span className="display-number text-lg text-teal">2,390 DOT</span>
              </div>
            </div>
          </div>
        </section>

        {/* 04 — Progression in the wild */}
        <section className="space-y-10">
          <SectionMarker n="04" label="A complete progression, end to end" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="tracking-editorial text-primary">Days 1–14</span>
              <h3 className="mt-3 font-display text-lg font-semibold">Assess → Improve</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Founder signs up, finishes Vantage, starts LEAPFROG. Vantage moves from 612 to 678 after closing
                the co-founder gap. Wallet: ~840 DOT.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="tracking-editorial text-teal">Weeks 3–10</span>
              <h3 className="mt-3 font-display text-lg font-semibold">Validate → Pitch</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Validation evidence (LOIs, pilots, waitlist) pushes market strength to 0.71. Enters Q3 Pitchathon,
                places 4th of 92. Wallet: ~1,340 DOT.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="tracking-editorial text-gold">Months 3–9</span>
              <h3 className="mt-3 font-display text-lg font-semibold">Fund → Scale</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Demo shortlists, three investor meetings, $25K committed by month 4. Seed close at month 9.
                Community earns DOT on the upgrade.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

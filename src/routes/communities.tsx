import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Link2, LayoutDashboard, Award, MessageSquare, Users2, BarChart3, Wallet } from "lucide-react";

export const Route = createFileRoute("/communities")({
  head: () => ({
    meta: [
      { title: "Communities — DOT" },
      {
        name: "description",
        content:
          "The Community Operating System powers community-led founder acquisition with referral links, dashboards, community Vantage and DOT leader rewards.",
      },
      { property: "og:title", content: "DOT Communities" },
      { property: "og:description", content: "Community-led growth for African ventures." },
    ],
  }),
  component: CommunitiesPage,
});

const features = [
  {
    icon: Link2,
    title: "Unique referral links",
    desc: "Each community gets a link like dot.africa/c/community-name to track visits, signups and activated founders end to end.",
  },
  {
    icon: LayoutDashboard,
    title: "Community dashboards",
    desc: "Members, active members, Vantage completions, Academy progress, Pitchathon entries and Demo qualifiers — all in one view.",
  },
  {
    icon: Award,
    title: "Community Vantage",
    desc: "Average community score, fundable ventures and active builders — with cross-community ranking on the leaderboard.",
  },
  {
    icon: Wallet,
    title: "Leader DOT rewards",
    desc: "Track referrals, engagement and completion rates and reward Community Leaders with DOT directly into their wallet.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp-first",
    desc: "Leaders connect WhatsApp groups and communities; DOT tracks engagement through platform activity without scraping messages.",
  },
  {
    icon: Users2,
    title: "100 communities pilot",
    desc: "100 founders per community, 100 Community Leaders — designed to scale to thousands once the pilot validates the model.",
  },
];

const mechanics = [
  {
    n: "01",
    label: "Leader applies",
    detail: "Community Leader submits the community for review — existing group size, focus area, location.",
  },
  {
    n: "02",
    label: "DOT issues a referral link",
    detail: "Leader receives dot.africa/c/your-name and onboarding kit. Every signup is attributed from that point on.",
  },
  {
    n: "03",
    label: "Founders sign up & activate",
    detail: "Signups must complete Vantage within 30 days to count as an activated founder for the community.",
  },
  {
    n: "04",
    label: "DOT tracks progression",
    detail: "Every Vantage reassessment, Academy module, Pitchathon entry and Demo meeting flows into the community dashboard.",
  },
  {
    n: "05",
    label: "Leader earns DOT",
    detail: "DOT is earned per activation, per stage transition and per funded milestone — visible in the leader wallet.",
  },
  {
    n: "06",
    label: "Community ranks up",
    detail: "Quarterly leaderboard. Top communities unlock co-branded Sessions, sponsored Pitchathons and capital introductions.",
  },
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

function CommunitiesPage() {
  return (
    <PageShell
      eyebrow="Community OS"
      title="Community-led growth, measured end to end"
      intro="Community Leaders recruit, activate and progress founders — and earn DOT for the value they create."
    >
      <div className="space-y-24">
        {/* 01 — Overview */}
        <section className="space-y-10">
          <SectionMarker n="01" label="What the Community OS is" />
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
                Distribution that <span className="text-purple">already works</span>, instrumented.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Africa's founder communities — the WhatsApp groups, the local accelerators,
                the founder circles — are the most effective distribution channel for new
                ventures. DOT doesn't replace them. It gives them a referral link, a
                dashboard, a community Vantage score and DOT rewards for the founders they
                bring into the network.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Communities keep running their own programming — DOT just measures what
                happens next, so good work compounds and Leaders get credited.
              </p>
            </div>
            <aside className="space-y-3 rounded-2xl border border-purple/40 bg-purple/5 p-6">
              <span className="tracking-editorial text-purple">Three roles, one network</span>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex gap-2"><span className="text-purple">→</span> <strong className="font-semibold">Founders</strong> progress through stages</li>
                <li className="flex gap-2"><span className="text-purple">→</span> <strong className="font-semibold">Leaders</strong> recruit + activate + support</li>
                <li className="flex gap-2"><span className="text-purple">→</span> <strong className="font-semibold">Communities</strong> rank on the leaderboard</li>
                <li className="flex gap-2"><span className="text-purple">→</span> DOT flows to the value each role creates</li>
              </ul>
            </aside>
          </div>
        </section>

        {/* 02 — Features grid */}
        <section className="space-y-10">
          <SectionMarker n="02" label="What Community Leaders get" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-purple/10 text-purple">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 03 — Referral mechanics, step by step */}
        <section className="space-y-10">
          <SectionMarker n="03" label="How referrals actually work" />
          <ol className="relative space-y-6 border-l border-border pl-8 sm:pl-10">
            {mechanics.map((m) => (
              <li key={m.n} className="relative">
                <span className="absolute -left-[44px] flex size-9 items-center justify-center rounded-full border border-purple/40 bg-purple/10 font-display text-sm font-bold text-purple">
                  {m.n}
                </span>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-display text-lg font-semibold">{m.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 04 — Community Vantage, the scoring layer */}
        <section className="space-y-10">
          <SectionMarker n="04" label="Community Vantage" />
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-4">
              <h2 className="font-display text-3xl font-light tracking-tight">
                A score <span className="text-purple">for the community</span>, not just the founder.
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Community Vantage rolls up the Vantage scores of every activated member,
                weighted by stage. It answers a simple question: is this community producing
                ventures that move? Leaders see their own community Vantage and how they
                compare to peers — without anyone else's data leaking.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Leaderboards are public. Per-founder data is private to the Leader and the
                individual founder.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border bg-purple/5 px-5 py-3">
                <span className="tracking-editorial text-purple">Illustrative leaderboard</span>
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <BarChart3 className="size-3.5" /> Pilot cohort
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Community</th>
                    <th className="px-5 py-3 font-semibold">City</th>
                    <th className="px-5 py-3 font-semibold text-right">Members</th>
                    <th className="px-5 py-3 font-semibold text-right">Avg. Vantage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-5 py-3 font-medium">Lagos Founders Circle</td>
                    <td className="px-5 py-3 text-muted-foreground">Lagos</td>
                    <td className="px-5 py-3 text-right display-number">142</td>
                    <td className="px-5 py-3 text-right display-number text-purple">681</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-medium">Accra Build Collective</td>
                    <td className="px-5 py-3 text-muted-foreground">Accra</td>
                    <td className="px-5 py-3 text-right display-number">118</td>
                    <td className="px-5 py-3 text-right display-number text-purple">664</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-medium">Nairobi Tech Safari</td>
                    <td className="px-5 py-3 text-muted-foreground">Nairobi</td>
                    <td className="px-5 py-3 text-right display-number">201</td>
                    <td className="px-5 py-3 text-right display-number text-purple">657</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-medium">Cape Town Venture Studio</td>
                    <td className="px-5 py-3 text-muted-foreground">Cape Town</td>
                    <td className="px-5 py-3 text-right display-number">96</td>
                    <td className="px-5 py-3 text-right display-number text-purple">643</td>
                  </tr>
                </tbody>
              </table>
              <div className="border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                Illustrative — pilot leaderboard will be public once the cohort closes.
              </div>
            </div>
          </div>
        </section>

        {/* 05 — Apply */}
        <section className="space-y-10">
          <SectionMarker n="05" label="Bring your community into the pilot" />
          <div className="rounded-2xl border border-purple/40 bg-card p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-light tracking-tight sm:text-3xl">
                  Running a founder community? We'd like to talk.
                </h2>
                <p className="text-sm text-muted-foreground">
                  We're onboarding the first 100 Community Leaders for the pilot — Lagos,
                  Accra, Nairobi, Cape Town and anywhere else a real founder community
                  already exists. Tell us about your group, the founders you support, and
                  what you're hoping DOT can fix.
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2"><span className="text-purple">→</span> Pilot terms: 100 communities × 100 founders</li>
                  <li className="flex gap-2"><span className="text-purple">→</span> No fee. Leaders earn DOT from day one.</li>
                  <li className="flex gap-2"><span className="text-purple">→</span> WhatsApp-friendly — we integrate with how you already work.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-dashed border-border bg-background/40 p-5 text-sm">
                <span className="tracking-editorial text-muted-foreground">What we'll ask</span>
                <ul className="mt-3 space-y-2 text-foreground/90">
                  <li>· Where your community lives and how it's organised</li>
                  <li>· Roughly how many founders you currently support</li>
                  <li>· What you wish was easier today</li>
                  <li>· A community Leader point of contact</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Target, Users, Zap, Globe, MapPin, Mail } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/seo/Seo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About DOT — Africa's Venture Progression Network" },
      { name: "description", content: "DOT is building Africa's venture progression infrastructure — measurable, scalable, community-led." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: Target, title: "Measurable progress", desc: "Every stage, score and milestone on DOT is quantified. We believe founders deserve clarity, not vague advice." },
  { icon: Users, title: "Community-led growth", desc: "Africa's builder communities are the distribution layer. DOT is infrastructure for them, not a replacement." },
  { icon: Zap, title: "Move fast, stay fundable", desc: "Speed matters. DOT compresses the journey from idea to investor-ready without cutting corners." },
  { icon: Globe, title: "Pan-African by design", desc: "Built for Lagos, Nairobi, Accra, Cape Town and everywhere in between — not adapted for Africa from elsewhere." },
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

function AboutPage() {
  return (
    <PageShell
      eyebrow="About DOT"
      title="Building Africa's venture progression infrastructure"
      intro="DOT is the operating system for African venture creation — combining intelligence, education, community and capital access into one measurable network."
    >
      <Seo
        title="About DOT — Africa's Venture Progression Network"
        description="DOT is building Africa's venture progression infrastructure — measurable, scalable, community-led."
      />
      <div className="space-y-24">
        {/* 01 — Mission */}
        <section className="space-y-10">
          <SectionMarker n="01" label="Our mission" />
          <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div className="space-y-5">
              <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
                Make African venture creation{" "}
                <span className="text-primary">measurable, not opaque</span>.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Right now, the path from idea to funded in Africa runs through informal networks,
                opaque accelerators and well-connected mentors. The most promising founders are
                often the most isolated — and the most ready ventures are invisible to capital.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                DOT changes that. We give every founder a quantifiable score (Vantage), a
                measurable progression through seven stages, and a community + capital network
                that uses the same numbers. Investors and community leaders finally speak the
                same language as founders.
              </p>
            </div>
            <aside className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <span className="tracking-editorial text-primary">What we measure</span>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex gap-2"><span className="text-primary">→</span> Vantage Point (0–1000) — overall venture quality</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Founder readiness — skills, evidence, commitment</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Market strength — size, traction, defensibility</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Fundability — investor fit and readiness signals</li>
              </ul>
            </aside>
          </div>
        </section>

        {/* 02 — Story */}
        <section className="space-y-10">
          <SectionMarker n="02" label="Company story" />
          <div className="max-w-3xl space-y-5">
            <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
              Started by operators who saw the gap up close.
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              DOT was founded in 2026 by a small team of African operators and engineers
              who had worked inside accelerators, angel networks and venture studios across
              Lagos, Accra, Nairobi and Cape Town. The same pattern showed up everywhere:
              brilliant founders, fragmented support, no shared definition of what "ready
              to fund" actually means.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              We started DOT as infrastructure for communities that already support
              founders — the WhatsApp groups, the local accelerators, the founder circles
              — and built the scoring, progression and capital-matching layer those
              communities were missing.
            </p>
          </div>
        </section>

        {/* 03 — Values */}
        <section className="space-y-10">
          <SectionMarker n="03" label="Our values" />
          <div className="grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div key={v.title} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-display font-semibold">{v.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 04 — Team */}
        <section className="space-y-10">
          <SectionMarker n="04" label="The team" />
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-light tracking-tight">Team page coming soon.</h2>
                <p className="max-w-xl text-sm text-muted-foreground">
                  We're a small, deliberately lean team building Africa's venture
                  progression infrastructure. We'll publish full bios, photos and
                  advisory board details as we finalize our pilot and prepare
                  our public launch — rather than fabricate placeholders now.
                </p>
                <p className="text-xs text-muted-foreground">
                  In the meantime, reach out directly if you'd like to talk shop, partner, or apply to join.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <a
                  href="mailto:hello@dot.africa"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline underline-offset-4"
                >
                  <Mail className="size-4" /> hello@dot.africa
                </a>
                <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" /> Lagos · Accra · Nairobi · Cape Town
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 05 — Honest framing: real scope, no fake numbers */}
        <section className="space-y-10">
          <SectionMarker n="05" label="Where we are, honestly" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="tracking-editorial text-muted-foreground">Status</span>
              <h3 className="mt-3 font-display text-xl font-light">In pilot</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                DOT is live with a closed pilot of founders, communities and capital
                partners. We publish numbers as we collect them — not before.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="tracking-editorial text-gold">Target scope</span>
              <h3 className="mt-3 font-display text-xl font-light text-gold">10,000 · 100 · $200K</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                10,000 founders, 100 communities, $200,000 of pilot capital routed
                through DOT Demo. These are goals for the pilot — not vanity counts.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="tracking-editorial text-muted-foreground">Coverage</span>
              <h3 className="mt-3 font-display text-xl font-light">Pan-African</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Built for Lagos, Nairobi, Accra, Cape Town and everywhere in between.
                English is the operating language today; more locales follow.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-2xl border border-border [background-image:var(--gradient-primary)] p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl">Join the pilot</h2>
          <p className="mt-2 text-primary-foreground/80">
            10,000 founders. 100 communities. $200K in capital. Starting now.
          </p>
          <Button variant="gold" size="lg" className="mt-6" asChild>
            <Link to="/auth">Get started <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

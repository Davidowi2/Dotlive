import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Target, Users, Zap, Globe } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";

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

const TEAM = [
  { name: "Amara Okafor", role: "Co-founder & CEO", location: "Lagos", initial: "A" },
  { name: "Kwame Asante", role: "Co-founder & CTO", location: "Accra", initial: "K" },
  { name: "Fatima Al-Rashid", role: "Head of Investor Relations", location: "Nairobi", initial: "F" },
];

function AboutPage() {
  return (
    <PageShell
      eyebrow="About DOT"
      title="Building Africa's venture progression infrastructure"
      intro="DOT is the operating system for African venture creation — combining intelligence, education, community and capital access into one measurable network."
    >
      <div className="space-y-16">
        <section>
          <h2 className="font-display text-2xl font-bold">Our values</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
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

        <section>
          <h2 className="font-display text-2xl font-bold">The team</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {TEAM.map((t) => (
              <div key={t.name} className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center">
                <div className="flex size-16 items-center justify-center rounded-full [background-image:var(--gradient-primary)] font-display text-2xl font-bold text-primary-foreground">
                  {t.initial}
                </div>
                <p className="mt-3 font-display font-semibold">{t.name}</p>
                <p className="text-sm text-primary">{t.role}</p>
                <p className="text-xs text-muted-foreground">{t.location}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-border [background-image:var(--gradient-primary)] p-8 text-center">
          <h2 className="font-display text-2xl font-bold text-primary-foreground">Join the pilot</h2>
          <p className="mt-2 text-primary-foreground/80">10,000 founders. 100 communities. $200K in capital. Starting now.</p>
          <Button variant="gold" size="lg" className="mt-6" asChild>
            <Link to="/auth">Get started <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

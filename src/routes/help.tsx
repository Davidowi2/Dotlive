import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, MessageSquare, BookOpen, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help & Support — DOT" }] }),
  component: HelpPage,
});

const FAQS = [
  { q: "What is the Vantage Point?", a: "Vantage Point is DOT's 0–1000 score measuring your venture's quality across 9 dimensions: Founder, Problem, Market, Validation, Product, Team, Revenue, Scalability, and Investment Readiness. Higher scores unlock better visibility and investor access." },
  { q: "How do I deposit DOT?", a: "Go to Wallet → Deposit DOT. We use Paystack for secure Naira payments. Minimum deposit is 2,000 DOT (₦30,000). Your wallet is credited instantly after payment verification." },
  { q: "How do I join a community?", a: "Ask your community leader for their referral link (format: dot.africa/join/CODE) or scan their QR code. You'll be added automatically after clicking the link while signed in." },
  { q: "How are pitchathon scores calculated?", a: "Each judge scores your application from 1–10. Your leaderboard position is based on the average score across all judges assigned to that pitchathon." },
  { q: "Can I have multiple roles?", a: "Currently DOT supports one primary role per account. You can be a Founder, Community Leader, or Investor. Contact support if you need to change your role." },
  { q: "How do I earn DOT?", a: "Complete Academy courses to earn DOT rewards. Each course has a fixed reward set by admins. You can also receive DOT via transfers from other users or admin credits." },
  { q: "Is my data safe?", a: "Yes. DOT uses Supabase with Row Level Security — every piece of data is scoped to your account. Payments are handled by Paystack and we never store card details." },
];

const CATEGORIES = [
  { icon: BookOpen, title: "Academy & Learning", desc: "Courses, completion, and DOT rewards" },
  { icon: MessageSquare, title: "Pitchathons", desc: "Applications, scoring, and leaderboards" },
  { icon: HelpCircle, title: "Wallet & Payments", desc: "Deposits, transfers, and transaction history" },
  { icon: Mail, title: "Account & Profile", desc: "Roles, settings, and verification" },
];

function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <PageShell eyebrow="Help & Support" title="How can we help?" intro="Find answers, browse guides, or reach out to the DOT team.">
      <div className="space-y-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <div key={c.title} className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-soft">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="size-5" />
              </span>
              <div>
                <p className="font-display font-semibold">{c.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <section>
          <h2 className="font-display text-xl font-semibold">Frequently asked questions</h2>
          <div className="mt-5 space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-accent/50 transition-colors"
                >
                  {faq.q}
                  {open === i ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
                </button>
                {open === i && (
                  <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <Mail className="mx-auto size-8 text-primary" />
          <h3 className="mt-3 font-display text-lg font-semibold">Still need help?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Our team is here for you. Reach us at support@dot.africa</p>
          <Button variant="hero" className="mt-4" asChild>
            <a href="mailto:support@dot.africa">Email support</a>
          </Button>
        </section>
      </div>
    </PageShell>
  );
}

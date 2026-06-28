/**
 * /help — User-facing guide to DOT OS.
 *
 * Answers the most-asked questions new users hit on day 1:
 *   - What is DOT? What's a DOT ID?
 *   - How do gigs (challenges) work?
 *   - What's a venture? How do I create one?
 *   - What are scores & how do they update?
 *   - How do builders rank up?
 *   - How do I get DOT? Spend DOT?
 *   - How do I cash out?
 *
 * Built so first-time users have ONE place to look instead of bouncing
 * across 14 sidebar items.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Sparkles,
  Wallet,
  Trophy,
  Rocket,
  Shield,
  Building2,
  Users,
  CheckCircle2,
  HelpCircle,
  Coins,
  Send,
  ArrowDownToLine,
  Award,
  TrendingUp,
  Layers,
  Flag,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resetWizard } from "@/api/wizard";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({ meta: [{ title: "Help — DOT" }] }),
  component: HelpPage,
});

interface FaqItem {
  q: string;
  a: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: FaqItem[];
}[] = [
  {
    id: "basics",
    title: "Getting started",
    icon: Sparkles,
    description: "What DOT is and how to set up your account.",
    items: [
      {
        icon: Sparkles,
        q: "What is DOT?",
        a: (
          <>
            <p>
              DOT is Africa's <strong>venture progression network</strong> —
              an operating system that takes a founder from{" "}
              <em>idea to funded</em> with measurable steps along the way.
            </p>
            <p>
              It runs on the <strong>DOT token</strong>, which has a hard
              cap of <strong>100 billion</strong>. Every action you take
              (build, pitch, vote, mentor) earns DOT. DOT can be cashed
              out to a Nigerian bank once you're KYC-verified.
            </p>
          </>
        ),
      },
      {
        icon: Wallet,
        q: "What's a DOT ID?",
        a: (
          <>
            <p>
              A DOT ID is your <strong>public handle</strong> on the network —
              it looks like{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                swift-rogue-21abc4de
              </code>
              . Other users can send you DOT, vote for you, or invite you
              to challenges using your DOT ID.
            </p>
            <p>
              It's <strong>not</strong> your email. Your email is private.
              Your DOT ID is what shows up on leaderboards, voting cards,
              and transfer screens.
            </p>
          </>
        ),
      },
      {
        icon: Coins,
        q: "How do I get DOT?",
        a: (
          <>
            <p>You start with a <strong>500 DOT signup bonus</strong>. After that, you earn DOT by:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Completing challenges (gigs) — see below</li>
              <li>Winning public votes on DOT Demo</li>
              <li>Mentoring other builders</li>
              <li>Receiving transfers from Capital Partners</li>
              <li>Buying DOT via Paystack deposit</li>
            </ul>
          </>
        ),
      },
      {
        icon: Shield,
        q: "Why do I need KYC?",
        a: (
          <>
            <p>
              KYC (Know Your Customer) is required by Nigerian banking
              regulation before we can send money to your bank account.
            </p>
            <p>
              <strong>Tier 1</strong> (BVN or NIN): up to <strong>50,000 DOT</strong> per withdrawal.
              <br />
              <strong>Tier 2</strong> (BVN + NIN): up to <strong>500,000 DOT</strong>.
              <br />
              <strong>Tier 3</strong> (Government ID + CAC for businesses): unlimited.
            </p>
            <p>
              You can still earn, build, vote, and transfer DOT to other
              users without KYC — you only need it to <em>cash out</em>.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "gigs",
    title: "Gigs & challenges",
    icon: Rocket,
    description: "How challenges work and how to find them.",
    items: [
      {
        icon: Flag,
        q: "What is a 'gig' or 'challenge'?",
        a: (
          <>
            <p>
              A <strong>challenge</strong> (also called a gig) is a time-boxed
              contest with a DOT prize pool. Examples:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li><strong>DOT Demo July 2026</strong> — 1,000,000 DOT prize pool</li>
              <li><strong>Campus Challenge 2026</strong> — 500,000 DOT in scholarships</li>
              <li><strong>ARISE Top 10 Builders</strong> — 200,000 DOT for the top 10 reputation gainers</li>
            </ul>
            <p>
              Challenges can be <strong>posted</strong> by founders,
              communities, capital partners, universities, or admins.
            </p>
          </>
        ),
      },
      {
        icon: Trophy,
        q: "How do I create a gig?",
        a: (
          <>
            <p>
              Anyone with a <strong>founder</strong>,{" "}
              <strong>community_leader</strong>, or{" "}
              <strong>capital_partner</strong> role can post a challenge:
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>Go to <strong>Builder Arena</strong> in the sidebar</li>
              <li>Click <strong>Post a challenge</strong></li>
              <li>Fill in: title, description, prize pool (in DOT), end date, eligibility</li>
              <li>Pick whether voting is public, judge-only, or both</li>
              <li>Submit. Your DOT balance will be debited the prize-pool amount (held in escrow)</li>
            </ol>
            <p className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
              <strong>Heads up:</strong> the prize-pool amount is locked from
              your wallet when the challenge is published. It returns to you
              automatically if no one wins.
            </p>
          </>
        ),
      },
      {
        icon: Trophy,
        q: "How do I submit to a gig?",
        a: (
          <>
            <p>Two ways to enter a challenge:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>
                <strong>Open Track</strong> — anyone with the role can submit.
                Your submission goes to the public vote.
              </li>
              <li>
                <strong>Invitational Track</strong> — only builders nominated
                by a Capital Partner or admin can submit. Higher DOT prize,
                fewer competitors.
              </li>
            </ul>
            <p>
              Click any event on the <strong>DOT Demo</strong> page to see
              submission instructions per challenge.
            </p>
          </>
        ),
      },
      {
        icon: Send,
        q: "How are gig winners paid?",
        a: (
          <>
            <p>
              When a challenge ends, the prize pool is automatically split
              and sent to the winners' DOT wallets. Distribution is handled
              by the DOT token-supply contract — no manual transfers, no
              middleman.
            </p>
            <p>
              You'll get an in-app notification and an email. The full audit
              trail is on the <strong>Wallet → Transactions</strong> page.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "scoring",
    title: "Scores & reputation",
    icon: TrendingUp,
    description: "How Vantage scores work and what they mean.",
    items: [
      {
        icon: Layers,
        q: "What is Vantage score?",
        a: (
          <>
            <p>
              <strong>Vantage</strong> is your <em>venture credibility</em>{" "}
              score from <strong>0 to 1,000</strong>. It's computed from five
              sub-scores:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li><strong>Skill</strong> (30%) — Academy courses completed + scores</li>
              <li><strong>Output</strong> (25%) — Ventures submitted, challenges completed</li>
              <li><strong>Reputation</strong> (20%) — votes received from peers + judges</li>
              <li><strong>Network</strong> (15%) — endorsements from mentors, collaborators</li>
              <li><strong>Tenure</strong> (10%) — how long you've been active</li>
            </ul>
            <p>
              The score updates <strong>daily at midnight UTC</strong>. You
              can see the breakdown on the <strong>Vantage</strong> page.
            </p>
          </>
        ),
      },
      {
        icon: Award,
        q: "How does a builder rank up?",
        a: (
          <>
            <p>
              Builder ranks are tied to your Vantage score and DOT earned.
              There are five ranks:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li><strong>Apprentice</strong> (0–199) — just signed up, 500 DOT</li>
              <li><strong>Builder</strong> (200–399) — completed first gig</li>
              <li><strong>Operator</strong> (400–599) — Vantage 400+, 5+ gigs</li>
              <li><strong>Architect</strong> (600–799) — Vantage 600+, DOT Demo finalist</li>
              <li><strong>Founder</strong> (800–1,000) — Vantage 800+, funded or revenue-generating</li>
            </ul>
            <p>
              Higher ranks unlock: bigger challenges, lower KYC tiers,
              Capital Partner matches, and DOT Demo by-invitation tracks.
            </p>
          </>
        ),
      },
      {
        icon: TrendingUp,
        q: "Can I lose score?",
        a: (
          <>
            <p>Yes — Vantage decays if you go inactive.</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>No activity for 30 days: −2% per week</li>
              <li>Submission gets rejected by judges: −5 points</li>
              <li>Plagiarism / cheating: −50 points + ban</li>
              <li>Community reports upheld: −10 to −100 depending on severity</li>
            </ul>
            <p>
              The decay stops as soon as you complete any action (vote,
              submit, comment, mentor, etc).
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "money",
    title: "Wallet, transfers, cash-out",
    icon: Wallet,
    description: "How DOT moves in and out.",
    items: [
      {
        icon: Coins,
        q: "How do I deposit DOT?",
        a: (
          <>
            <p>
              Go to <strong>Wallet → Deposit DOT</strong>. We use{" "}
              <strong>Paystack</strong> — Nigeria's largest payment processor.
              Minimum deposit is 2,000 DOT. Pay with:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Card (Verve, Visa, Mastercard)</li>
              <li>Bank transfer</li>
              <li>USSD</li>
            </ul>
            <p>
              DOT is credited to your wallet within 5 seconds of Paystack
              confirming the payment.
            </p>
          </>
        ),
      },
      {
        icon: Send,
        q: "How do I send DOT to another user?",
        a: (
          <>
            <p>Two ways:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>
                <strong>By DOT ID</strong> — fastest. Go to{" "}
                <strong>Wallet → Withdraw / Send</strong>, enter their DOT ID,
                amount, optional note. Free, instant.
              </li>
              <li>
                <strong>By username lookup</strong> — type the dotId prefix
                (e.g. <code className="rounded bg-muted px-1">swift-rogue</code>)
                and the form will autocomplete.
              </li>
            </ul>
            <p>There is a <strong>2,000 DOT</strong> daily transfer limit for un-verified users.</p>
          </>
        ),
      },
      {
        icon: ArrowDownToLine,
        q: "How do I withdraw to my bank?",
        a: (
          <>
            <p>
              Go to <strong>Wallet → Withdraw to bank</strong>. You'll need:
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>Approved KYC (Tier 1 minimum — BVN or NIN)</li>
              <li>A Nigerian bank account in your name</li>
            </ol>
            <p>
              Withdrawal limits match your KYC tier. Withdrawals are reviewed
              within 1–2 business days and paid via Paystack to your account.
              <strong> Withdrawal fee is 1.5%</strong> (covers Paystack + bank charges).
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "community",
    title: "Communities & roles",
    icon: Users,
    description: "How the social layer works.",
    items: [
      {
        icon: Building2,
        q: "What is a community?",
        a: (
          <>
            <p>
              A community is a <strong>themed group</strong> on DOT — e.g.
              "Lagos Founders Hub", "MIT Sandbox Africa", "Web3 Lagos".
              Communities have a leader, members, and a tier (Free / Verified /
              Campus / Enterprise).
            </p>
            <p>
              <strong>Verified</strong> (200K DOT/yr) communities get a green
              badge and a banner on the discovery page.
              <br />
              <strong>Campus</strong> (200K DOT/yr) is free for university
              clubs and gets scholarship-matching.
              <br />
              <strong>Enterprise</strong> (500K DOT/yr) is for accelerators
              and gets featured placement.
            </p>
          </>
        ),
      },
      {
        icon: Users,
        q: "What role should I pick?",
        a: (
          <>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>
                <strong>Builder</strong> — joining teams, learning skills,
                completing gigs. <strong>Free, default.</strong>
              </li>
              <li>
                <strong>Founder</strong> — pitching ventures, applying for
                funding. <strong>500 DOT/yr</strong> (auto-eligible for the
                500 DOT signup bonus).
              </li>
              <li>
                <strong>Investor</strong> — browsing, saving, following
                ventures. <strong>Free.</strong>
              </li>
              <li>
                <strong>Capital Partner</strong> — committing funds, hosting
                events. <strong>Free, application required.</strong>
              </li>
              <li>
                <strong>Community Leader</strong> — running a community,
                verifying members. <strong>Free.</strong>
              </li>
              <li>
                <strong>Vendor</strong> — selling services in DOT Work.
                <strong>Free.</strong>
              </li>
            </ul>
            <p>
              You can have <strong>multiple roles</strong>. An admin can grant
              you any role via <strong>Admin → Members → Manage roles</strong>.
            </p>
          </>
        ),
      },
      {
        icon: Briefcase,
        q: "What is DOT Work?",
        a: (
          <>
            <p>
              <strong>DOT Work</strong> is the marketplace — services and
              jobs you can buy or sell with DOT. Examples:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Logo design for 5,000 DOT</li>
              <li>React dev 2-week contract for 50,000 DOT</li>
              <li>Mentorship session for 1,000 DOT</li>
            </ul>
            <p>
              Vendors post offerings; buyers pay via the DOT escrow system
              (funds held until buyer confirms delivery).
            </p>
          </>
        ),
      },
      {
        icon: GraduationCap,
        q: "What is Academy?",
        a: (
          <>
            <p>
              <strong>DOT Academy</strong> is the learning layer. Courses on
              venture building, fundraising, product, etc. Each course has:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Free intro modules (open to all)</li>
              <li>Premium paid modules (DOT per lesson)</li>
              <li>A final assessment</li>
              <li>A certificate on completion (counts toward Vantage)</li>
            </ul>
          </>
        ),
      },
    ],
  },
];

function HelpPage() {
  return (
    <AppShell>
      <PageHeader
        title="Help & FAQ"
        subtitle="Everything you need to know to get the most out of DOT OS."
      />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-8">
        {/* Quick start */}
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HelpCircle className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold">
                  New here? Start with the basics.
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Most first-day questions are answered in the first two
                  sections below. Use the table of contents to jump to a
                  topic.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <a href="#basics">Getting started</a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href="#gigs">Gigs &amp; challenges</a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href="#scoring">Scores &amp; ranking</a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href="#money">Wallet &amp; cash-out</a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold">
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {section.items.map((item, i) => (
                  <FaqAccordion key={i} item={item} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Footer CTA */}
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">
              Still stuck?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Email <strong>hello@dotlive.cv</strong> or DM <strong>@DOTafrica</strong> on X.
              We respond within 24 hours.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <TourButton />
              <Button asChild>
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/wallet">View wallet</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
          <span className="font-medium text-sm sm:text-base">{item.q}</span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5">
          <div className="prose prose-sm max-w-none space-y-2 text-sm leading-relaxed text-foreground/90 [&_p]:text-foreground/90 [&_li]:text-foreground/90 [&_strong]:text-foreground">
            {item.a}
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * TourButton — "Take the tour again" from Help. Resets the wizard
 * state then triggers the WizardHost to re-open.
 */
function TourButton() {
  const [opening, setOpening] = useState(false);
  const qc = useQueryClient();
  const resetM = useMutation({
    mutationFn: resetWizard,
    onSuccess: async () => {
      // Clear the host's `shown` flag by remounting via a refresh trick:
      // the simplest approach is to invalidate the state query and let
      // WizardHost pick up that completed=false again.
      await qc.invalidateQueries({ queryKey: ["wizard", "state"] });
      // The wizard overlay's `open` state lives in __root; we trigger
      // a one-off route reload by pushing a query param.
      const url = new URL(window.location.href);
      url.searchParams.set("tour", String(Date.now()));
      window.location.href = url.toString();
    },
  });
  return (
    <Button
      variant="outline"
      onClick={() => {
        setOpening(true);
        resetM.mutate();
      }}
      disabled={opening || resetM.isPending}
    >
      <Sparkles className="size-4" />
      {resetM.isPending ? "Starting tour…" : "Take the tour again"}
    </Button>
  );
}

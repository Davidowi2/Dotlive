// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Rocket,
  GraduationCap,
  Hammer,
  Wallet,
  Users,
  Search,
  Compass,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.js";
import { AppShell } from "../components/AppShell.js";
import { api } from "../api/client.js";

/**
 * DOT onboarding — personalized by entry point.
 *
 * Why-first principle:
 *   We never ask "What's your stack?" or "Years of experience?"
 *   in screen one. Those questions exclude learners, hustlers,
 *   returnees, and people who came via Whop / Academy and don't
 *   think in those terms.
 *
 *   Instead we ask "Why are you here?" — 8 plain-language
 *   reasons. The system then derives what to ask next.
 *
 *   This is screen 1 (Why) + screen 2 (Path summary).
 *   Subsequent screens are owned by the role-specific flow:
 *     - Builders: services, portfolio links, availability
 *     - Founders: venture name, industry, stage
 *     - Investors: ticket size, sectors
 *     - Learners: skill they want, time per week
 *     - Community leaders: region, category
 *
 *   The backend derives those flows from the intent below.
 */

interface IntentOption {
  id: Intent;
  label: string;
  icon: any;
  blurb: string;
  /** A few plain-language follow-up questions we'll ask later. */
  followUpHints: string[];
}

type Intent =
  | "learn_skill"
  | "start_business"
  | "find_work"
  | "hire_talent"
  | "find_investment"
  | "lead_community"
  | "explore"
  | "referral";

const INTENTS: IntentOption[] = [
  {
    id: "learn_skill",
    label: "I want to learn a skill",
    icon: GraduationCap,
    blurb: "Courses, mentors, and paid practice gigs to build real experience.",
    followUpHints: ["What skill are you learning?", "Hours per week you can commit"],
  },
  {
    id: "start_business",
    label: "I want to start a business",
    icon: Rocket,
    blurb: "Build a venture, earn your first DOT, get matched with investors.",
    followUpHints: ["What problem are you solving?", "Who is it for?"],
  },
  {
    id: "find_work",
    label: "I want to find paid work",
    icon: Hammer,
    blurb: "Browse gigs from founders, get paid in DOT, build a portfolio.",
    followUpHints: ["What kind of work?", "Are you available now or learning?"],
  },
  {
    id: "hire_talent",
    label: "I want to hire builders",
    icon: Search,
    blurb: "Post jobs and gigs, review portfolios, pay with DOT.",
    followUpHints: ["What role do you need first?", "Stage of your venture"],
  },
  {
    id: "find_investment",
    label: "I want to invest in founders",
    icon: Wallet,
    blurb: "Browse vetted ventures, save the ones you like, request meetings.",
    followUpHints: ["What stage do you back?", "Typical ticket size"],
  },
  {
    id: "lead_community",
    label: "I want to build a community",
    icon: Users,
    blurb: "Create a regional or sector community, refer founders in, earn DOT.",
    followUpHints: ["Where is your community?", "What brings them together?"],
  },
  {
    id: "explore",
    label: "I'm just exploring",
    icon: Compass,
    blurb: "Look around. Earn DOT by completing your profile and first actions.",
    followUpHints: [],
  },
  {
    id: "referral",
    label: "I was invited by someone",
    icon: Sparkles,
    blurb: "Use the invite code they shared with you.",
    followUpHints: ["Invite code (optional)"],
  },
];

/** Default suggested next steps per intent. Server can override. */
const SUGGESTED_NEXT: Record<Intent, string[]> = {
  learn_skill: [
    "Take a 10-minute Vantage assessment (you earn 50 DOT)",
    "Browse 3 free Academy courses",
    "Apply to a Starter gig to practice what you learn",
  ],
  start_business: [
    "Take the Vantage assessment to define your venture stage",
    "Add 1 line about your venture idea",
    "Post your first gig when you need a builder",
  ],
  find_work: [
    "Take a 10-minute Vantage assessment (you earn 50 DOT)",
    "Pick your top 3 categories",
    "Browse open gigs in DOT Work",
  ],
  hire_talent: [
    "Upgrade to Founder (2,000 DOT) to post jobs",
    "Write a short brief about your venture",
    "Browse portfolios of builders in your category",
  ],
  find_investment: [
    "Upgrade to Investor (10,000 DOT) for the investor dashboard",
    "Pick 3 sectors you follow",
    "Set your typical ticket size",
  ],
  lead_community: [
    "Upgrade to Community Leader (1,000 DOT) to create a community",
    "Tell us your region and category",
    "Generate your referral code and start inviting founders",
  ],
  explore: [
    "Take the Vantage assessment (you earn 50 DOT)",
    "Look at the 3 How It Works steps on the home page",
    "Ask a question in the Academy community",
  ],
  referral: [
    "Paste your invite code (if you have one)",
    "Take the Vantage assessment so your inviter gets credit",
    "Explore what's free this week",
  ],
};

const STORAGE_KEY = "dotlive.onboarding.intent";

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [intent, setIntent] = useState<Intent | null>(
    () => (localStorage.getItem(STORAGE_KEY) as Intent | null) ?? null
  );
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);

  // Persist intent as soon as the user picks one — so a refresh
  // doesn't lose their choice. The backend write happens once
  // they hit "Continue" on the path-summary screen.
  useEffect(() => {
    if (intent) localStorage.setItem(STORAGE_KEY, intent);
  }, [intent]);

  // If they already have an intent stored AND the server already
  // saw it, skip to dashboard. Otherwise show screen 1.
  // (Server check happens in /api/users/me payload via metadata.)

  if (!intent) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
            Step 1 of 2
          </div>
          <h1 className="font-display text-4xl font-bold">Why are you here?</h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Pick the reason that fits. We'll tailor everything after this — no wrong answers.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {INTENTS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setIntent(opt.id)}
                  className="group flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg font-semibold">{opt.label}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">{opt.blurb}</p>
                  </div>
                  <ArrowRight className="size-5 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>
      </AppShell>
    );
  }

  const selected = INTENTS.find((o) => o.id === intent)!;
  const nextSteps = SUGGESTED_NEXT[intent];

  async function finish() {
    setBusy(true);
    try {
      await api.post("/api/onboarding/intent", {
        intent,
        inviteCode: inviteCode.trim() || undefined,
      });
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Your DOT path is set.");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e?.message ?? "Could not save your path. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => setIntent(null)}
          className="mb-6 flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="size-4" /> Change my answer
        </button>

        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
          Step 2 of 2
        </div>
        <h1 className="font-display text-4xl font-bold">Your DOT path</h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Based on your answer, here's how {user?.name?.split(" ")[0] ?? "you"} will start on DOT.
        </p>

        <div className="glass mt-8 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <selected.icon className="size-6 text-[var(--primary)]" />
            <p className="font-display text-xl font-semibold">{selected.label}</p>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{selected.blurb}</p>

          {selected.id === "referral" && (
            <div className="mt-5">
              <label className="mb-1.5 block text-sm">Invite code (optional)</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. swift-founders-26a3k2"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 outline-none focus:border-[var(--primary)]"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                We use it to credit your inviter. You'll be matched to a community or founder based on the code.
              </p>
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Suggested next steps
            </p>
            <ol className="mt-3 space-y-2 text-sm">
              {nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {selected.followUpHints.length > 0 && (
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Next you'll answer:{" "}
            <span className="text-[var(--text)]">{selected.followUpHints.join(" · ")}</span>
          </p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Link to="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
            Skip for now
          </Link>
          <button onClick={finish} disabled={busy} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
            {busy ? "Saving…" : <>Continue to DOT <ArrowRight className="size-4" /></>}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

/**
 * WizardOverlay — full-screen onboarding wizard.
 *
 * Shows on first authenticated render when wizardState.completed is false.
 * 7 steps: Welcome → Profile → Wallet → Vantage → Discover → Community → Apply.
 * Each step has "Next" + "Skip" + back arrow. Progress dots top center.
 * Closing persists to backend; user can re-take from Help → "Take the tour".
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, UserCircle2, Wallet, Gauge, Compass, Users, Briefcase,
  ChevronRight, ChevronLeft, X, ArrowRight, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  fetchWizardState,
  completeWizard,
  skipWizard,
  saveWizardStep,
} from "@/api/wizard";

interface Step {
  id: string;
  icon: typeof Sparkles;
  eyebrow: string;
  title: string;
  body: string;
  bullets?: string[];
  cta?: { label: string; href?: string; action?: "next" };
}

const STEPS: Step[] = [
  {
    id: "welcome",
    icon: Sparkles,
    eyebrow: "Welcome to DOT",
    title: "Africa's venture progression network",
    body: "DOT is where builders meet founders, where founders meet investors, and where ideas meet funding. This 7-step tour takes 90 seconds — you can re-take it any time from Help.",
    cta: { label: "Let's go", action: "next" },
  },
  {
    id: "profile",
    icon: UserCircle2,
    eyebrow: "Step 1 of 6",
    title: "Complete your profile",
    body: "Your DOT ID is your identity across the platform — it's how other people find, mention, and pay you. Make it count.",
    bullets: [
      "Add a name + avatar (we'll auto-pull from Google if you signed up with OAuth)",
      "Pick a builder headline — one sentence about what you build",
      "Set your skills so the right people can find you",
    ],
    cta: { label: "Edit profile", href: "/profile" },
  },
  {
    id: "wallet",
    icon: Wallet,
    eyebrow: "Step 2 of 6",
    title: "Get your first DOT",
    body: "Every account starts with 500 DOT — enough to hire a builder, post a job, or pitch at Demo Day. Top up with Paystack when you want more.",
    bullets: [
      "500 DOT welcome bonus credited automatically",
      "Deposit via Paystack (card, transfer, USSD)",
      "Withdraw to any Nigerian bank — 27 banks supported",
    ],
    cta: { label: "Open wallet", href: "/wallet" },
  },
  {
    id: "vantage",
    icon: Gauge,
    eyebrow: "Step 3 of 6",
    title: "Take Vantage — 90 seconds",
    body: "Vantage scores your venture 0-1000 across 9 dimensions: problem, product, validation, founder, team, market, scalability, revenue, investment readiness. Investors use it as a single comparable signal.",
    bullets: [
      "20 multiple-choice questions, takes ~90 seconds",
      "Score updates every time you retake",
      "Below 700 = promising. Above 700 = investor-ready.",
    ],
    cta: { label: "Take Vantage", href: "/vantage" },
  },
  {
    id: "discover",
    icon: Compass,
    eyebrow: "Step 4 of 6",
    title: "Discover what's being built",
    body: "Browse ventures, builders, events, and communities across the platform. Upvote what excites you, save what you want to come back to.",
    bullets: [
      "Filter by role, status, location",
      "Upvote + comment threads on every venture",
      "Save ventures to your personal shortlist",
    ],
    cta: { label: "Open Discover", href: "/discover" },
  },
  {
    id: "community",
    icon: Users,
    eyebrow: "Step 5 of 6",
    title: "Find your people",
    body: "Communities are groups of people around shared interests — admins post to channels, members reply, you earn DOT for showing up. The conversation is the product.",
    bullets: [
      "Default channels: #general, #announcements, #help",
      "Admins post; everyone replies",
      "Join unlimited communities, leave any time",
    ],
    cta: { label: "Open Communities", href: "/communities" },
  },
  {
    id: "ship",
    icon: Briefcase,
    eyebrow: "Step 6 of 6",
    title: "Post or apply — your first gig",
    body: "Whether you're building a product, hiring a builder, or looking for your first paid gig — DOT Work is where work happens. Every job post is funded in DOT, every gig is escrowed, every payout is instant.",
    bullets: [
      "Builders: post a service or apply to a job",
      "Founders: post a job, fund escrow, release on delivery",
      "Investors: see who's getting hired this week",
    ],
    cta: { label: "Open Builder Arena", href: "/work" },
  },
];

export function WizardOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const stateQ = useQuery({
    queryKey: ["wizard", "state"],
    queryFn: fetchWizardState,
    enabled: open,
  });

  const [step, setStep] = useState(0);
  const total = STEPS.length;

  const completeM = useMutation({
    mutationFn: completeWizard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wizard", "state"] });
      onClose();
    },
  });

  const skipM = useMutation({
    mutationFn: skipWizard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wizard", "state"] });
      onClose();
    },
  });

  const stepM = useMutation({ mutationFn: saveWizardStep });

  // Resume from where they left off
  useEffect(() => {
    if (stateQ.data?.lastStep) setStep(Math.min(stateQ.data.lastStep, total - 1));
  }, [stateQ.data?.lastStep, total]);

  // Keyboard: Esc closes (skips), → advances
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") skipM.mutate(step);
      if (e.key === "ArrowRight") advance();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  const advance = () => {
    if (step < total - 1) {
      const next = step + 1;
      setStep(next);
      stepM.mutate(next);
    } else {
      completeM.mutate();
    }
  };

  const back = () => {
    if (step > 0) {
      const next = step - 1;
      setStep(next);
      stepM.mutate(next);
    }
  };

  if (!open) return null;
  const current = STEPS[step];
  const isLast = step === total - 1;
  const Icon = current.icon;
  const progress = ((step + 1) / total) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
    >
      {/* Card */}
      <div className="relative mx-4 flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/60">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-emerald-400 uppercase">
            <Sparkles className="h-3 w-3" />
            DOT ONBOARDING
          </div>
          <button
            onClick={() => skipM.mutate(step)}
            aria-label="Skip wizard"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-white/[0.03]">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-6 py-10 sm:px-10 sm:py-14">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
              {current.eyebrow}
            </span>
          </div>

          <h2 id="wizard-title" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {current.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-400">
            {current.body}
          </p>

          {current.bullets && (
            <ul className="mt-5 space-y-2.5">
              {current.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          )}

          {current.cta && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {current.cta.href && (
                <a
                  href={current.cta.href}
                  onClick={() => {
                    navigate({ to: current.cta!.href as any });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  {current.cta.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {!current.cta.href && current.cta.action === "next" && (
                <Button onClick={advance} className="rounded-lg" size="sm">
                  {current.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer / nav */}
        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-6 py-4">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setStep(i);
                  stepM.mutate(i);
                }}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-6 bg-emerald-500" : "w-1.5 bg-white/15 hover:bg-white/30",
                )}
              />
            ))}
          </div>

          <button
            onClick={advance}
            disabled={completeM.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {isLast ? "Finish" : "Next"}
            {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

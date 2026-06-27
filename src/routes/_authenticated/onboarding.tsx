/**
 * /onboarding — first-run flow for new users.
 *
 *   Step 1: Pick a primary role (Builder is free; paid roles show cost)
 *   Step 2 (Founder only): venture profile
 *   Step 3: Privacy + Terms consent (REQUIRED)
 *   Step 4: Complete onboarding → /dashboard
 *
 * New users get 500 DOT on signup. Paid roles cost:
 *   - founder:          2,000 DOT
 *   - investor:        10,000 DOT
 *   - community_leader: 1,000 DOT
 *   - builder:              0 DOT (free default)
 *
 * If user picks a paid role and can't afford it, we show a clear message
 * suggesting they start as Builder (free) and upgrade later from /wallet.
 */

import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Hammer, Rocket, Users, Briefcase, Loader2, ArrowRight, ArrowLeft,
  Check, ShieldCheck, ScrollText, AlertTriangle,
} from "lucide-react";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { dotApi, ApiError } from "@/api/client";
import type { RoleRequirement } from "@/types/api";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { INDUSTRIES, AFRICAN_COUNTRIES, type AppRole } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get started — DOT" }] }),
  component: Onboarding,
});

type Step = 1 | 2 | 3 | 4;

type RoleMeta = { title: string; desc: string; icon: any; badge?: string };
const ROLE_META: Record<"builder" | "founder" | "community_leader" | "investor", RoleMeta> = {
  builder: {
    title: "Builder",
    desc: "Offer skills, earn DOT, and access the marketplace. Your default starting role on DOT.",
    icon: Hammer,
    badge: "Free · Recommended",
  },
  founder: {
    title: "Founder",
    desc: "I'm building a venture and want to progress, learn and raise.",
    icon: Rocket,
  },
  community_leader: {
    title: "Community Leader",
    desc: "I run a community and want to onboard and track founders.",
    icon: Users,
  },
  investor: {
    title: "Investor",
    desc: "I want to discover and back African ventures.",
    icon: Briefcase,
  },
};

const ROLE_ORDER: AppRole[] = ["builder", "founder", "community_leader", "investor"];

function Onboarding() {
  const navigate = useNavigate();
  const { user, refresh } = useDotAuth();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<AppRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [requirements, setRequirements] = useState<RoleRequirement[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(500); // optimistic default

  // Founder profile
  const [ventureName, setVentureName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");

  // Consent
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // ── Load role requirements + wallet balance on mount ──
  useEffect(() => {
    (async () => {
      try {
        const [reqs, wallet] = await Promise.all([
          dotApi.get<{ requirements: RoleRequirement[] }>("/api/users/roles/requirements"),
          dotApi.get<{ balance: number }>("/api/wallet"),
        ]);
        setRequirements(reqs.requirements ?? []);
        setWalletBalance(wallet.balance ?? 0);
      } catch (e) {
        // best-effort — defaults above are used if these fail
      }
    })();
  }, []);

  // ── If already onboarded, redirect to dashboard ──
  useEffect(() => {
    if (user?.onboardedAt && user.roles.length > 1) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  const costFor = (r: AppRole): number => {
    if (r === "builder") return 0;
    return requirements.find((x) => x.role === r)?.dotCost ?? 0;
  };

  const canAfford = (r: AppRole): boolean => walletBalance >= costFor(r);

  function selectRole(r: AppRole) {
    setRole(r);
    if (r === "founder") {
      setStep(2);
    } else {
      // skip founder-profile step
      setStep(3);
    }
  }

  async function handleFounderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ventureName.trim()) {
      toast.error("Please enter your venture name.");
      return;
    }
    setStep(3);
  }

  async function handleConsentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acceptPrivacy || !acceptTerms) {
      toast.error("Please accept both the Privacy Policy and Terms of Service to continue.");
      return;
    }
    if (!role) return;
    setBusy(true);
    try {
      // If the role costs DOT and user can afford it, try to grant via roles endpoint.
      // If they can't afford it, force-downgrade to builder.
      const cost = costFor(role);
      let effectiveRole: AppRole = role;

      if (cost > 0) {
        if (canAfford(role)) {
          try {
            await dotApi.post("/api/users/roles", { user_id: user!.id, role });
          } catch (err) {
            // 402 / insufficient → fall back to builder
            if (err instanceof ApiError && err.status === 402) {
              toast.error(
                `You need ${cost} DOT to be a ${(ROLE_META as any)[role].title}, but only have ${walletBalance}. ` +
                `Starting as Builder (free) — you can upgrade later from your wallet.`
              );
              effectiveRole = "builder";
            } else {
              throw err;
            }
          }
        } else {
          toast.error(
            `You need ${cost} DOT to be a ${(ROLE_META as any)[role].title}, but only have ${walletBalance}. ` +
            `Starting as Builder (free) — upgrade later from your wallet.`
          );
          effectiveRole = "builder";
        }
      }

      // For founder with venture data, save profile
      if (effectiveRole === "founder" && ventureName) {
        await dotApi.post("/api/users/me/founder-profile", {
          ventureName, industry, country, bio,
          stage: "Assess",
        });
      }

      // Mark onboarded + stamp consent
      await dotApi.post("/api/users/me/complete-onboarding", {
        acceptPrivacy: true,
        acceptTerms: true,
        primaryRole: effectiveRole,
      });

      await refresh();
      toast.success("Welcome to DOT!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message
        : err instanceof Error ? err.message
        : "Could not complete setup";
      toast.error(msg);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border/60 bg-background/80">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Wallet: <strong>{walletBalance.toLocaleString()} DOT</strong>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {/* Progress bar */}
        <div className="mb-6 flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
              className="text-muted-foreground hover:text-foreground"
              disabled={busy}
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <div className="flex flex-1 gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all",
                  s <= step ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Step {step} of 3</span>
        </div>

        {/* ── STEP 1: Pick role ── */}
        {step === 1 && (
          <>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Step 1 of 3
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold">
                What are you joining as?
              </h1>
              <p className="mt-2 text-muted-foreground">
                {user?.name ? `Welcome, ${user.name.split(" ")[0]}. ` : ""}
                Pick the role that fits you best. You can change this anytime from settings.
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {ROLE_ORDER.map((r) => {
                const meta = (ROLE_META as any)[r];
                const cost = costFor(r);
                const Icon = meta.icon;
                const affordable = canAfford(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => selectRole(r)}
                    disabled={busy}
                    className={cn(
                      "group relative flex items-center gap-4 rounded-2xl border bg-card p-5 text-left transition-all hover:border-foreground/30 hover:shadow-md disabled:opacity-60",
                      role === r ? "border-primary ring-2 ring-primary/20" : "border-border",
                      !affordable && r !== "builder" && "opacity-90",
                    )}
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-display text-lg font-semibold">{meta.title}</span>
                        {meta.badge && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                            {meta.badge}
                          </span>
                        )}
                      </span>
                      <span className="block text-sm text-muted-foreground">{meta.desc}</span>
                      {cost > 0 && (
                        <span className={cn(
                          "mt-1 inline-flex items-center gap-1 text-xs",
                          affordable ? "text-muted-foreground" : "text-warning",
                        )}>
                          {affordable ? (
                            <>Costs {cost.toLocaleString()} DOT</>
                          ) : (
                            <>
                              <AlertTriangle className="size-3" />
                              Needs {cost.toLocaleString()} DOT (you have {walletBalance}) — start as Builder & upgrade later
                            </>
                          )}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── STEP 2: Founder profile (only if role = founder) ── */}
        {step === 2 && role === "founder" && (
          <>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Step 2 of 3
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Check className="size-3" /> Founder
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold">Tell us about your venture</h1>
              <p className="mt-2 text-muted-foreground">You can refine this anytime.</p>
            </div>
            <form onSubmit={handleFounderSubmit} className="mx-auto mt-8 max-w-lg space-y-4">
              <div className="space-y-2">
                <Label htmlFor="venture">Venture name</Label>
                <Input id="venture" required value={ventureName} onChange={(e) => setVentureName(e.target.value)} placeholder="FarmLink Africa" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Short bio</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What does your venture do?" rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={busy}>Back</Button>
                <Button type="submit" variant="hero" className="flex-1" disabled={busy}>
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          </>
        )}

        {/* ── STEP 3: Privacy + Terms consent (REQUIRED) ── */}
        {step === 3 && role && (
          <form onSubmit={handleConsentSubmit} className="mx-auto max-w-lg space-y-6">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Step 3 of 3
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold">One last thing</h1>
              <p className="mt-2 text-muted-foreground">
                Please review and accept our policies to finish setting up your account.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm leading-relaxed">
                  I have read and accept the{" "}
                  <Link to="/privacy" target="_blank" className="font-medium text-primary hover:underline inline-flex items-center gap-1">
                    <ShieldCheck className="size-3.5" /> Privacy Policy
                  </Link>.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 size-5 shrink-0 rounded border-input accent-primary"
                />
                <span className="text-sm leading-relaxed">
                  I have read and accept the{" "}
                  <Link to="/terms" target="_blank" className="font-medium text-primary hover:underline inline-flex items-center gap-1">
                    <ScrollText className="size-3.5" /> Terms of Service
                  </Link>.
                </span>
              </label>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
              <p className="font-medium">Setup summary:</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>Role: <strong className="text-foreground">{(ROLE_META as any)[role].title}</strong>{costFor(role) > 0 && ` (${costFor(role).toLocaleString()} DOT will be debited)`}</li>
                {role === "founder" && ventureName && <li>Venture: <strong className="text-foreground">{ventureName}</strong></li>}
                <li>Wallet balance after: <strong className="text-foreground">{(walletBalance - costFor(role)).toLocaleString()} DOT</strong></li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(role === "founder" ? 2 : 1)}
                disabled={busy}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="hero"
                className="flex-1"
                disabled={busy || !acceptPrivacy || !acceptTerms}
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Enter DOT
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
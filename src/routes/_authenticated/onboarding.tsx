/**
 * /onboarding — first-run flow for new users.
 *
 *   Step 1: Pick a primary role
 *   Step 2: Role details
 *   Step 3: Skills & availability
 *   Step 4: Verification / KYC teaser
 *   Step 5: Email confirm / privacy consent
 *   Step 6: 2FA / security
 *   Step 7: Complete → dashboard
 *
 * New users get 500 DOT on signup. Paid roles cost:
 *   - founder:          2,000 DOT
 *   - investor:        10,000 DOT
 *   - capital_partner: 5,000 DOT
 *   - community_leader: 1,000 DOT
 *   - builder:              0 DOT (free default)
 *
 * If user picks a paid role and can't afford it, we show a clear message
 * suggesting they start as Builder (free) and upgrade later from /wallet.
 */

import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Hammer, Rocket, Users, Briefcase, Building2, Loader2, ArrowRight, ArrowLeft,
  Check, ShieldCheck, ScrollText, AlertTriangle, DollarSign, User, Globe,
  Linkedin, Github, MapPin, Star, Sparkles,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { INDUSTRIES, AFRICAN_COUNTRIES, WORK_CATEGORIES, type AppRole } from "@/lib/constants";
import { toast } from "sonner";
import { uploadPitchDeck } from "@/api/upload";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Get started — DOT" }] }),
  component: Onboarding,
});

type Step = 1 | 2 | 3 | 4;

type RoleMeta = { title: string; desc: string; icon: any; badge?: string };
const ROLE_META: Record<string, RoleMeta> = {
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
  capital_partner: {
    title: "Capital Partner",
    desc: "I represent an institution and want to deploy capital.",
    icon: Building2,
  },
};

const ROLE_ORDER: AppRole[] = ["builder", "founder", "community_leader", "investor", "capital_partner"];

const SUGGESTED_SKILLS = [
  "React", "TypeScript", "Node.js", "Python", "JavaScript", "HTML/CSS",
  "Figma", "UI/UX Design", "Graphic Design", "Adobe Photoshop", "Illustrator",
  "Content Writing", "Copywriting", "SEO", "Social Media Marketing",
  "Video Editing", "Photography", "Motion Graphics",
  "Data Analysis", "Excel", "SQL", "Machine Learning",
  "Project Management", "Customer Support", "Sales",
];

const INVESTOR_CAPITAL_TYPES = ["angel", "vc", "family_office", "fund", "corporate"] as const;
const INVESTOR_CHECK_SIZES = ["<10K", "10K-50K", "50K-250K", "250K+"] as const;

function Onboarding() {
  const navigate = useNavigate();
  const { user, refresh } = useDotAuth();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<AppRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [requirements, setRequirements] = useState<RoleRequirement[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(500);

  // Builder profile
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [builderLocation, setBuilderLocation] = useState("");

  // Founder profile
  const [ventureName, setVentureName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [pitchDeck, setPitchDeck] = useState<File | null>(null);
  const [website, setWebsite] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [emailLink, setEmailLink] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [discordLink, setDiscordLink] = useState("");

  // Investor profile
  const [investorCapitalType, setInvestorCapitalType] = useState("");
  const [investorCheckSize, setInvestorCheckSize] = useState("");
  const [investorFocusAreas, setInvestorFocusAreas] = useState<string[]>([]);
  const [investorTrackRecord, setInvestorTrackRecord] = useState("");

  // Capital Partner profile
  const [cpInstitutionName, setCpInstitutionName] = useState("");
  const [cpAum, setCpAum] = useState("");
  const [cpFocusAreas, setCpFocusAreas] = useState<string[]>([]);
  const [cpFundThesis, setCpFundThesis] = useState("");
  const [cpDecisionMaker, setCpDecisionMaker] = useState("");
  const [cpTrackRecord, setCpTrackRecord] = useState("");

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
    setStep(2);
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }

  function addCustomSkill() {
    const skill = customSkill.trim();
    if (!skill) return;
    if (selectedSkills.includes(skill)) {
      toast.error("Skill already added");
      return;
    }
    setSelectedSkills((prev) => [...prev, skill]);
    setCustomSkill("");
  }

  function toggleFocusArea(area: string, state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) {
    setState((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  async function handleBuilderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedSkills.length < 3) {
      toast.error("Please select at least 3 skills");
      return;
    }
    if (!hourlyRate || Number(hourlyRate) <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }
    setStep(3);
  }

  async function handleFounderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ventureName.trim()) {
      toast.error("Please enter your venture name.");
      return;
    }
    setStep(3);
  }

  async function handleInvestorSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!investorCapitalType) {
      toast.error("Please select your capital type");
      return;
    }
    if (!investorCheckSize) {
      toast.error("Please select your typical check size");
      return;
    }
    setStep(3);
  }

  async function handleCapitalPartnerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cpInstitutionName.trim()) {
      toast.error("Please enter your institution name");
      return;
    }
    if (!cpAum.trim()) {
      toast.error("Please enter your AUM");
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
      const cost = costFor(role);
      let effectiveRole: AppRole = role;

      if (cost > 0) {
        if (canAfford(role)) {
          try {
            await dotApi.post("/api/users/roles", { user_id: user!.id, role });
          } catch (err) {
            if (err instanceof ApiError && err.status === 402) {
              toast.error(
                `You need ${cost} DOT to be a ${(ROLE_META as any)[role].title}, but only have ${walletBalance}. ` +
                `Starting as Builder (free) — you can upgrade later from your wallet.`,
              );
              effectiveRole = "builder";
            } else {
              throw err;
            }
          }
        } else {
          toast.error(
            `You need ${cost} DOT to be a ${(ROLE_META as any)[role].title}, but only have ${walletBalance}. ` +
            `Starting as Builder (free) — upgrade later from your wallet.`,
          );
          effectiveRole = "builder";
        }
      }

      // Save role-specific profile
      if (effectiveRole === "founder" && ventureName) {
        let pitchDeckUrl: string | undefined;
        if (pitchDeck) {
          pitchDeckUrl = await uploadPitchDeck(pitchDeck);
        }
        await dotApi.post("/api/users/me/founder-profile", {
          ventureName, industry, country, bio,
          stage: "Assess",
          website,
          whatsappLink,
          emailLink,
          telegramLink,
          discordLink,
          ...(pitchDeckUrl ? { pitchDeckUrl } : {}),
        });
      } else if (effectiveRole === "builder") {
        await dotApi.post("/api/users/me/builder-profile", {
          headline: selectedSkills.slice(0, 3).join(", ") || "Builder",
          bio: bio || "DOT platform member",
          skills: selectedSkills,
          hourlyDot: Number(hourlyRate) || 0,
          experienceLevel: experienceLevel || undefined,
          location: builderLocation || undefined,
        });
      } else if (effectiveRole === "investor") {
        await dotApi.post("/api/users/me/investor-profile", {
          capitalType: investorCapitalType,
          checkSize: investorCheckSize,
          focusAreas: investorFocusAreas,
          trackRecord: investorTrackRecord || undefined,
        });
      } else if (effectiveRole === "capital_partner") {
        await dotApi.post("/api/users/me/capital-partner-profile", {
          institutionName: cpInstitutionName,
          aum: cpAum,
          focusAreas: cpFocusAreas,
          fundThesis: cpFundThesis || undefined,
          decisionMakerContact: cpDecisionMaker || undefined,
          trackRecord: cpTrackRecord || undefined,
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

  const totalSteps = 3;
  const showStep2 = step === 2 && role;

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
          <span className="text-xs text-muted-foreground">Step {step} of {totalSteps}</span>
        </div>

        {/* ── STEP 1: Pick role ── */}
        {step === 1 && (
          <>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                Step 1 of {totalSteps}
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
                const meta = ROLE_META[r];
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

        {/* ── STEP 2: Role-specific onboarding ── */}
        {showStep2 && role === "founder" && (
          <form onSubmit={handleFounderSubmit} className="mx-auto mt-8 max-w-lg space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Check className="size-3" /> Founder
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold">Tell us about your venture</h1>
              <p className="mt-2 text-muted-foreground">You can refine this anytime.</p>
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="pitchDeck">Pitch deck (optional)</Label>
              <Input id="pitchDeck" type="file" accept=".pdf,.ppt,.pptx,.key" onChange={(e) => setPitchDeck(e.target.files?.[0] ?? null)} />
              {pitchDeck && (
                <p className="text-xs text-muted-foreground">Selected: {pitchDeck.name}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp link (required)</Label>
                <Input id="whatsapp" value={whatsappLink} onChange={(e) => setWhatsappLink(e.target.value)} placeholder="https://wa.me/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email link (required)</Label>
                <Input id="email" type="email" value={emailLink} onChange={(e) => setEmailLink(e.target.value)} placeholder="mailto:..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram">Telegram link (optional)</Label>
                <Input id="telegram" value={telegramLink} onChange={(e) => setTelegramLink(e.target.value)} placeholder="https://t.me/..." />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="discord">Discord link (optional)</Label>
                <Input id="discord" value={discordLink} onChange={(e) => setDiscordLink(e.target.value)} placeholder="https://discord.gg/..." />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={busy}>Back</Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={busy}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        )}

        {showStep2 && role === "builder" && (
          <form onSubmit={handleBuilderSubmit} className="mx-auto mt-8 max-w-lg space-y-5">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Hammer className="size-3" /> Builder Profile Setup
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold">What are your skills?</h1>
              <p className="mt-2 text-muted-foreground">Select at least 3 skills. These help clients find you.</p>
            </div>

            {selectedSkills.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your Skills ({selectedSkills.length})
                  </Label>
                  {selectedSkills.length >= 3 && (
                    <Badge variant="default" className="text-[10px]">
                      <Check className="mr-1 size-3" /> Ready
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setSelectedSkills((prev) => prev.filter((s) => s !== skill))}
                    >
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="custom-skill">Add a skill not listed below</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-skill"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="e.g. Webflow, 3D Modeling"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                />
                <Button type="button" onClick={addCustomSkill} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Or pick from popular skills</Label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SKILLS.map((skill) => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:border-primary/60"
                    onClick={() => toggleSkill(skill)}
                  >
                    {selectedSkills.includes(skill) && <Check className="mr-1 size-3" />}
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly-rate">Hourly rate (DOT)</Label>
              <div className="relative">
                <Input
                  id="hourly-rate"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="500"
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DOT/hr
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Experience level</Label>
              <div className="grid gap-3">
                {["entry", "intermediate", "expert"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setExperienceLevel(level)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-4 text-left transition-all hover:border-primary/40",
                      experienceLevel === level ? "border-primary bg-primary/5" : "border-border bg-card"
                    )}
                  >
                    <div>
                      <p className="font-medium capitalize">{level}</p>
                      <p className="text-xs text-muted-foreground">
                        {level === "entry" ? "0-2 years" : level === "intermediate" ? "2-5 years" : "5+ years"}
                      </p>
                    </div>
                    {experienceLevel === level && <Check className="size-5 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="builder-location">Where are you based? (Optional)</Label>
              <Select value={builderLocation} onValueChange={setBuilderLocation}>
                <SelectTrigger id="builder-location">
                  <SelectValue placeholder="Select your location" />
                </SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={busy}>
                Back
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={!hourlyRate || !experienceLevel}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        )}

        {showStep2 && role === "investor" && (
          <form onSubmit={handleInvestorSubmit} className="mx-auto mt-8 max-w-lg space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Briefcase className="size-3" /> Investor
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold">Investor profile</h1>
              <p className="mt-2 text-muted-foreground">Help founders understand your mandate.</p>
            </div>

            <div className="space-y-2">
              <Label>Capital type</Label>
              <div className="grid grid-cols-2 gap-2">
                {INVESTOR_CAPITAL_TYPES.map((ct) => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => setInvestorCapitalType(ct)}
                    className={cn(
                      "rounded-xl border p-3 text-sm capitalize transition-all hover:border-primary/40",
                      investorCapitalType === ct ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    {ct.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Check size</Label>
              <div className="grid grid-cols-2 gap-2">
                {INVESTOR_CHECK_SIZES.map((cs) => (
                  <button
                    key={cs}
                    type="button"
                    onClick={() => setInvestorCheckSize(cs)}
                    className={cn(
                      "rounded-xl border p-3 text-sm transition-all hover:border-primary/40",
                      investorCheckSize === cs ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    {cs}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Focus areas</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.slice(0, 12).map((area) => (
                  <Badge
                    key={area}
                    variant={investorFocusAreas.includes(area) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFocusArea(area, investorFocusAreas, setInvestorFocusAreas)}
                  >
                    {investorFocusAreas.includes(area) && <Check className="mr-1 size-3" />}
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investor-track">Track record</Label>
              <Textarea
                id="investor-track"
                value={investorTrackRecord}
                onChange={(e) => setInvestorTrackRecord(e.target.value)}
                placeholder="Notable investments, exits, or supporting materials."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={busy}>Back</Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={!investorCapitalType || !investorCheckSize}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        )}

        {showStep2 && role === "capital_partner" && (
          <form onSubmit={handleCapitalPartnerSubmit} className="mx-auto mt-8 max-w-lg space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Building2 className="size-3" /> Capital Partner
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold">Institution profile</h1>
              <p className="mt-2 text-muted-foreground">This submission requires admin approval.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cp-institution">Institution name</Label>
              <Input id="cp-institution" required value={cpInstitutionName} onChange={(e) => setCpInstitutionName(e.target.value)} placeholder="Horizon Capital" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cp-aum">AUM</Label>
              <Input id="cp-aum" required value={cpAum} onChange={(e) => setCpAum(e.target.value)} placeholder="e.g. $25M" />
            </div>

            <div className="space-y-2">
              <Label>Focus areas</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.slice(0, 12).map((area) => (
                  <Badge
                    key={area}
                    variant={cpFocusAreas.includes(area) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFocusArea(area, cpFocusAreas, setCpFocusAreas)}
                  >
                    {cpFocusAreas.includes(area) && <Check className="mr-1 size-3" />}
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cp-thesis">Fund thesis</Label>
              <Textarea
                id="cp-thesis"
                value={cpFundThesis}
                onChange={(e) => setCpFundThesis(e.target.value)}
                placeholder="Investment thesis, stages, geographies, and ticket sizes."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cp-contact">Decision-maker contact (optional)</Label>
              <Input id="cp-contact" value={cpDecisionMaker} onChange={(e) => setCpDecisionMaker(e.target.value)} placeholder="name@institution.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cp-track">Supporting materials (optional)</Label>
              <Textarea
                id="cp-track"
                value={cpTrackRecord}
                onChange={(e) => setCpTrackRecord(e.target.value)}
                placeholder="Deck, track record, or notes for admin review."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={busy}>Back</Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={!cpInstitutionName || !cpAum}>
                Submit for approval
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </form>
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
                {role === "builder" && selectedSkills.length > 0 && <li>Skills: <strong className="text-foreground">{selectedSkills.length} selected</strong></li>}
                {role === "investor" && investorCapitalType && <li>Capital type: <strong className="text-foreground">{investorCapitalType}</strong></li>}
                {role === "capital_partner" && cpInstitutionName && <li>Institution: <strong className="text-foreground">{cpInstitutionName}</strong></li>}
                <li>Wallet balance after: <strong className="text-foreground">{(walletBalance - costFor(role)).toLocaleString()} DOT</strong></li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
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

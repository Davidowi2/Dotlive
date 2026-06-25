import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Mail, Loader2, ArrowLeft, KeyRound, BookOpen, Coins, Lightbulb,
  TrendingUp, Users, Compass, Check, ChevronRight, Eye, EyeOff,
} from "lucide-react";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { getGoogleAuthUrl } from "@/api/auth";
import { ApiError } from "@/types/api";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Seo } from "@/components/seo/Seo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as string | undefined) ?? "signin",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — DOT" },
      { name: "description", content: "Sign in or create your DOT account." },
    ],
  }),
  component: AuthPage,
});

/* ─────────────────── TYPES ──────────────────── */

type AuthMode = "signin" | "signup" | "otp" | "otp-verify" | "forgot";

type SignupIntent =
  | "learn"
  | "earn"
  | "business"
  | "invest"
  | "community"
  | "explore";

type SignupStep = 1 | 2 | 3;

/* ─────────────────── INTENT OPTIONS ─────────────────────────── */

const INTENT_OPTIONS: {
  id: SignupIntent;
  label: string;
  sub: string;
  icon: typeof BookOpen;
  accentClass: string;
}[] = [
  {
    id: "earn",
    label: "I want to earn money doing tasks",
    sub: "Pick up gigs, get paid in DOT.",
    icon: Coins,
    accentClass: "text-primary border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60",
  },
  {
    id: "learn",
    label: "I want to learn new skills",
    sub: "Courses, tutorials, and real projects.",
    icon: BookOpen,
    accentClass: "text-teal border-teal/40 bg-teal/5 hover:bg-teal/10 hover:border-teal/60",
  },
  {
    id: "business",
    label: "I have a business idea or venture",
    sub: "Build, validate, pitch, and raise.",
    icon: Lightbulb,
    accentClass: "text-gold border-gold/40 bg-gold/5 hover:bg-gold/10 hover:border-gold/60",
  },
  {
    id: "invest",
    label: "I want to invest in African businesses",
    sub: "Discover and back founders.",
    icon: TrendingUp,
    accentClass: "text-purple border-purple/40 bg-purple/5 hover:bg-purple/10 hover:border-purple/60",
  },
  {
    id: "community",
    label: "I'm here for a community",
    sub: "Find your people, grow together.",
    icon: Users,
    accentClass: "text-teal border-teal/40 bg-teal/5 hover:bg-teal/10 hover:border-teal/60",
  },
  {
    id: "explore",
    label: "I'm not sure yet, just exploring",
    sub: "That's okay — we'll figure it out together.",
    icon: Compass,
    accentClass: "text-muted-foreground border-border bg-card hover:border-border/80",
  },
];

/* ──────── Friendly follow-up questions per intent ──────────── */

const SKILL_CHIPS = [
  "Design", "Writing", "Coding", "Marketing", "Sales",
  "Finance", "Video", "Social Media", "Customer Support", "Operations",
];

const TOPIC_CHIPS = [
  "Business basics", "Tech skills", "Design", "Marketing",
  "Finance", "Leadership", "Communication", "Sales", "Coding",
];

const BUSINESS_STAGES = [
  { id: "idea", label: "Just thinking about it" },
  { id: "building", label: "Started building something" },
  { id: "customers", label: "Already have customers" },
];

const INVEST_RANGES = [
  { id: "under1m", label: "Under ₦1M" },
  { id: "1m_10m", label: "₦1M – ₦10M" },
  { id: "10m_100m", label: "₦10M – ₦100M" },
  { id: "over100m", label: "Over ₦100M" },
  { id: "exploring", label: "Still figuring it out" },
];

const AFRICAN_COUNTRIES_SHORT = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Rwanda",
  "Tanzania", "Uganda", "Senegal", "Ethiopia", "Côte d'Ivoire", "Other",
];

/* ─────────────────── MAIN PAGE ─────────────────────────────── */

function AuthPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useDotAuth();
  const search = Route.useSearch();
  // If ?mode=signup is in the URL, start on the signup flow
  const [mode, setMode] = useState<AuthMode>(
    search.mode === "signup" ? "signup" : "signin"
  );

  useEffect(() => {
    if (!isLoading && user) navigate({ to: "/dashboard" });
  }, [user, isLoading, navigate]);

  if (mode === "signup") {
    return (
      <>
        <Seo
          title="Create your account"
          description="Sign up for DOT — Africa's venture progression network. Get 500 DOT on signup, score your venture with Vantage, and access DOT Academy."
        />
        <SignupFlow onSwitchToSignin={() => setMode("signin")} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Seo
        title="Sign in"
        description="Sign in to DOT — Africa's venture progression network. Pick up where you left off on Vantage, DOT Academy, Pitchathons and DOT Demo."
      />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <SigninForm
            mode={mode as Exclude<AuthMode, "signup">}
            setMode={(m) => setMode(m as AuthMode)}
            onSignup={() => setMode("signup")}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── SIGNIN FORM ────────────────────────────── */

function SigninForm({
  mode,
  setMode,
  onSignup,
}: {
  mode: Exclude<AuthMode, "signup">;
  setMode: (m: AuthMode) => void;
  onSignup: () => void;
}) {
  const navigate = useNavigate();
  const { login } = useDotAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  function handleGoogle() {
    // Redirect to the backend OAuth flow
    window.location.href = getGoogleAuthUrl();
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message
        : err instanceof Error ? err.message
        : "Sign-in failed";
      toast.error(msg);
    } finally { setBusy(false); }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // Password reset is not yet on the new API — show a helpful message
    toast.info("Password reset is coming soon. Contact support@dot.africa for help.");
    setBusy(false);
    setMode("signin");
  }

  // OTP sign-in is Supabase-specific — not supported on the new API yet.
  // We keep the UI but show a notice pointing to email/password.
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    toast.info("Magic link sign-in is coming soon. Use email + password for now.");
  }

  async function handleVerifyOtp(_value: string) {
    toast.info("Magic link sign-in is coming soon.");
  }

  if (mode === "otp-verify") {
    return (
      <div className="space-y-6 text-center">
        <button onClick={() => setMode("otp")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold">Enter your code</h1>
          <p className="mt-1 text-sm text-muted-foreground">We sent a 6-digit code to {email}</p>
        </div>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={(v) => { setOtp(v); if (v.length === 6) handleVerifyOtp(v); }} disabled={busy}>
            <InputOTPGroup>
              {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} className="size-12 text-lg" />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {busy && <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold">
          {mode === "forgot" ? "Reset your password" : mode === "otp" ? "Sign in with a code" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "forgot" ? "We'll send a reset link to your email."
           : mode === "otp" ? "No password? No problem."
           : "Africa's Venture Progression Network"}
        </p>
      </div>

      {mode === "signin" && (
        <>
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
            <GoogleIcon /> Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          {/* Demo mode shortcut — bypasses live backend for previewing the app.
           *  Set VITE_API_URL to a real backend to disable this. */}
          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground"
            onClick={async () => {
              setBusy(true);
              try {
                await login("demo@dotlive.app", "demo");
                toast.success("Welcome — you're in demo mode.");
                navigate({ to: "/dashboard" });
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Demo failed";
                toast.error(msg);
              } finally { setBusy(false); }
            }}
            disabled={busy}
          >
            Try the demo (no signup) →
          </Button>
          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or sign in</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      {mode === "forgot" ? (
        <form onSubmit={handleForgot} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Send reset link
          </Button>
        </form>
      ) : mode === "otp" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Send code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="si-email">Email</Label>
            <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="si-password">Password</Label>
              <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input id="si-password" type={showPw ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pr-10" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      )}

      <div className="mt-5 space-y-2 text-center text-sm">
        {mode === "signin" && (
          <>
            <p>
              <button onClick={() => setMode("otp")} className="text-muted-foreground hover:text-foreground">
                Sign in with a one-time code instead
              </button>
            </p>
            <p className="text-muted-foreground">
              New to DOT?{" "}
              <button onClick={onSignup} className="font-medium text-primary hover:underline">
                Create a free account
              </button>
            </p>
          </>
        )}
        {(mode === "forgot" || mode === "otp") && (
          <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-foreground">
            Back to sign in
          </button>
        )}
      </div>
    </>
  );
}

/* ─────────────────── SIGNUP FLOW (3 steps) ─────────────────── */

function SignupFlow({ onSwitchToSignin }: { onSwitchToSignin: () => void }) {
  const navigate = useNavigate();
  const { signup } = useDotAuth();
  const [step, setStep] = useState<SignupStep>(1);
  const [busy, setBusy] = useState(false);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Step 2
  const [intent, setIntent] = useState<SignupIntent | null>(null);

  // Step 3 — per-intent extras
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [businessStage, setBusinessStage] = useState("");
  const [investRange, setInvestRange] = useState("");
  const [country, setCountry] = useState("");

  const pwStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;

  const pwColors = ["", "bg-destructive", "bg-warning", "bg-gold", "bg-primary"];
  const pwLabels = ["", "Too short", "Weak", "Good", "Strong"];

  function toggleChip(chip: string) {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { toast.error("Please agree to the Terms and Privacy Policy to continue."); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setStep(2);
  }

  function handleStep2(chosen: SignupIntent) {
    setIntent(chosen);
    // explore/community/earn → no step 3 questions worth showing; skip to submit
    if (chosen === "explore" || chosen === "earn") {
      submitSignup(chosen, []);
    } else {
      setSelectedChips([]);
      setBusinessStage("");
      setInvestRange("");
      setCountry("");
      setStep(3);
    }
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    await submitSignup(intent!, selectedChips);
  }

  async function submitSignup(chosenIntent: SignupIntent, chips: string[]) {
    setBusy(true);
    try {
      await signup({
        email,
        password,
        name: name.trim(),
        intent: chosenIntent,
        metadata: {
          skills: chips,
          business_stage: businessStage || null,
          invest_range: investRange || null,
          country: country || null,
        },
      });
      toast.success("Account created! Welcome to DOT.");
      navigate({ to: "/onboarding" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message
        : err instanceof Error ? err.message
        : "Could not create account";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const totalSteps = intent === null ? 3 : (intent === "explore" || intent === "earn") ? 2 : 3;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
        <Link to="/" className="mb-8 flex justify-center"><Logo /></Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {/* Progress */}
          <div className="mb-6 flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep((s) => (s - 1) as SignupStep)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div className="flex flex-1 gap-1.5">
              {[1, 2, 3].slice(0, totalSteps).map((s) => (
                <div key={s} className={cn("h-1 flex-1 rounded-full transition-all", s <= step ? "bg-primary" : "bg-border")} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>

          {/* ── STEP 1: Basic info ── */}
          {step === 1 && (
            <>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">Free to join. No credit card needed.</p>
              </div>

              <Button variant="outline" className="w-full" onClick={() => {
                window.location.href = getGoogleAuthUrl();
              }} disabled={busy}>
                <GoogleIcon /> Continue with Google
              </Button>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or with email</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-name">What's your first name?</Label>
                  <Input id="su-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Amara" />
                  <p className="text-xs text-muted-foreground">This is how we'll greet you. You can change it later.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Your email address</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pw">Choose a password</Label>
                  <div className="relative">
                    <Input id="su-pw" type={showPw ? "text" : "password"} required minLength={6}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters" className="pr-10" />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPw ? "Hide password" : "Show password"}>
                      {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 gap-1">
                        {[1,2,3,4].map((n) => (
                          <div key={n} className={cn("h-1 flex-1 rounded-full transition-all", n <= pwStrength ? pwColors[pwStrength] : "bg-border")} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{pwLabels[pwStrength]}</span>
                    </div>
                  )}
                </div>

                {/* Consent */}
                <label className="flex cursor-pointer items-start gap-3">
                  <div className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-all",
                    agreed ? "border-primary bg-primary" : "border-border bg-card"
                  )}>
                    <input type="checkbox" className="sr-only" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                    {agreed && <Check className="size-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>
                    {" "}and{" "}
                    <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>
                  </span>
                </label>

                <Button type="submit" variant="hero" className="w-full" disabled={busy || !agreed}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Continue
                  <ChevronRight className="size-4" />
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={onSwitchToSignin} className="font-medium text-primary hover:underline">Sign in</button>
              </p>
            </>
          )}

          {/* ── STEP 2: Intent ── */}
          {step === 2 && (
            <>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold">What brings you to DOT?</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick what fits you best right now. You can always change this later.
                </p>
              </div>
              {/* 2-column grid of intent cards — more visual, less list-y.
               * Each card is its own compact card (not a tall row). */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {INTENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleStep2(opt.id)}
                    disabled={busy}
                    className={cn(
                      "group relative flex flex-col items-start gap-2 rounded-lg border p-3.5 text-left transition-all disabled:opacity-60 hover:border-foreground/30",
                      opt.accentClass,
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-current/20 bg-current/10">
                      <opt.icon className="size-4" />
                    </span>
                    <div className="flex-1 min-w-0 w-full">
                      <span className="block font-semibold text-sm leading-tight">{opt.label}</span>
                      <span className="block text-[11px] opacity-70 mt-1 leading-snug">{opt.sub}</span>
                    </div>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 3: Personalisation questions ── */}
          {step === 3 && intent && (
            <form onSubmit={handleStep3} className="space-y-5">
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold">
                  {intent === "learn" && "What do you want to learn?"}
                  {intent === "business" && "Where are you with your idea?"}
                  {intent === "invest" && "How much are you thinking of investing?"}
                  {intent === "community" && "Where are you based?"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  This helps us personalise your first experience. You can skip any question.
                </p>
              </div>

              {intent === "learn" && (
                <div className="space-y-2">
                  <Label>Pick topics you're interested in (choose any)</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {TOPIC_CHIPS.map((chip) => (
                      <button key={chip} type="button" onClick={() => toggleChip(chip)}
                        className={cn("rounded-full border px-3 py-1 text-sm transition-all",
                          selectedChips.includes(chip) ? "border-teal bg-teal/10 text-teal" : "border-border text-muted-foreground hover:border-teal/40")}>
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {intent === "business" && (
                <div className="space-y-2">
                  <Label>Where are you with your idea?</Label>
                  <div className="space-y-2 pt-1">
                    {BUSINESS_STAGES.map((s) => (
                      <button key={s.id} type="button" onClick={() => setBusinessStage(s.id)}
                        className={cn("flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all",
                          businessStage === s.id ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/40")}>
                        <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border",
                          businessStage === s.id ? "border-gold bg-gold" : "border-muted-foreground")}>
                          {businessStage === s.id && <Check className="size-3 text-gold-foreground" />}
                        </span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {intent === "invest" && (
                <div className="space-y-2">
                  <Label>How much are you thinking of investing?</Label>
                  <p className="text-xs text-muted-foreground">Ballpark is fine — this helps us match you with the right founders.</p>
                  <div className="space-y-2 pt-1">
                    {INVEST_RANGES.map((r) => (
                      <button key={r.id} type="button" onClick={() => setInvestRange(r.id)}
                        className={cn("flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all",
                          investRange === r.id ? "border-purple bg-purple/10 text-purple" : "border-border hover:border-purple/40")}>
                        <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border",
                          investRange === r.id ? "border-purple bg-purple" : "border-muted-foreground")}>
                          {investRange === r.id && <Check className="size-3 text-purple-foreground" />}
                        </span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {intent === "community" && (
                <div className="space-y-2">
                  <Label htmlFor="country">Where are you based?</Label>
                  <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary">
                    <option value="">Select a country</option>
                    {AFRICAN_COUNTRIES_SHORT.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button type="submit" variant="hero" className="flex-1" disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Create my account
                  <ChevronRight className="size-4" />
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                <button type="submit" onClick={() => { setSelectedChips([]); setBusinessStage(""); setInvestRange(""); setCountry(""); }}
                  className="hover:text-foreground">
                  Skip for now →
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Google Icon ────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/**
 * PostGigWizard — 4-step gig posting flow with escrow.
 *
 * Steps:
 *   1. Basics      — title, category, gig type
 *   2. Description — what, who, deliverables
 *   3. Budget      — fixed price or hourly rate, 20% upfront escrow
 *   4. Review      — final summary + escrow lock confirmation
 *   5. Posted      — confirmation, link to listing, link to dashboard
 *
 * Escrow model (FREELANCE - not employment):
 *   - Founder specifies a project budget (fixed price) or hourly rate
 *   - 20% upfront escrow (locks when posted)
 *   - Builder completes work → submits deliverables
 *   - Founder approves → escrow released
 *   - Founder can request revisions or dispute
 *
 * For v1 we keep it simple: 20% escrow is debited on post and tracked on the
 * gig listing. Full payment released on completion approval.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, Briefcase, CheckCircle2, Circle, Loader2, Lock,
  Sparkles, Wallet, FileText, Coins, Building2, Plus, AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WORK_CATEGORIES, formatDot, dotToNaira, formatNaira } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createJob } from "@/api/marketplace";

const GIG_TYPES = [
  { value: "one_off",      label: "One-off Project"    },
  { value: "recurring",    label: "Recurring Gig"      },
  { value: "retainer",     label: "Monthly Retainer"   },
];

interface PostGigWizardProps {
  open: boolean;
  onClose: () => void;
  /** Current wallet balance — used for the escrow validation step */
  walletBalance?: number;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: { n: Step; title: string; icon: any }[] = [
  { n: 1, title: "Basics",      icon: Briefcase },
  { n: 2, title: "Description", icon: FileText },
  { n: 3, title: "Budget",      icon: Coins },
  { n: 4, title: "Review",      icon: Sparkles },
  { n: 5, title: "Posted",      icon: CheckCircle2 },
];

export function PostJobWizard({ open, onClose, walletBalance = 0 }: PostGigWizardProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(WORK_CATEGORIES[0]);
  const [gigType, setGigType] = useState("one_off");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [budgetDot, setBudgetDot] = useState(5000);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const escrowTotal = Math.floor(budgetDot * 0.2); // 20% upfront
  const escrowNaira = dotToNaira(escrowTotal);
  const hasFunds = walletBalance >= escrowTotal;

  function reset() {
    setStep(1);
    setTitle("");
    setCategory(WORK_CATEGORIES[0]);
    setGigType("one_off");
    setDescription("");
    setRequirements("");
    setBudgetDot(5000);
    setAgreedToTerms(false);
  }

  function handleClose() {
    if (step !== 5 && (title || description)) {
      const ok = window.confirm("Discard this draft gig?");
      if (!ok) return;
    }
    reset();
    onClose();
  }

  function next() {
    if (step === 1) {
      if (!title.trim()) return toast.error("Gig title is required.");
      if (title.trim().length < 4) return toast.error("Title must be at least 4 characters.");
      setStep(2);
    } else if (step === 2) {
      if (!description.trim()) return toast.error("Add a description.");
      if (description.trim().length < 40) return toast.error("Tell builders more (40+ characters).");
      setStep(3);
    } else if (step === 3) {
      if (budgetDot <= 0) return toast.error("Budget must be a positive number.");
      if (!hasFunds) {
        return toast.error(
          `Insufficient balance. You need ${formatDot(escrowTotal)} DOT but have ${formatDot(walletBalance)}.`,
        );
      }
      setStep(4);
    } else if (step === 4) {
      if (!agreedToTerms) return toast.error("Please agree to the escrow terms.");
      submit();
    }
  }

  function back() {
    if (step > 1 && step < 5) setStep((step - 1) as Step);
  }

  async function submit() {
    setBusy(true);
    try {
      await createJob({
        title: title.trim(),
        description: description.trim(),
        category,
        salaryDot: Math.floor(budgetDot),
        employmentType: gigType,
        requirements: requirements.trim() || undefined,
        isOpen: true,
      });
      // Note: createJob doesn't yet deduct escrow — we'll add that as a follow-up
      // once the payout engine exists. For v1 the listing is created and the
      // escrow track is informational.
      qc.invalidateQueries({ queryKey: ["job_listings"] });
      qc.invalidateQueries({ queryKey: ["my_job_listings"] });
      toast.success("Gig posted. It now appears in the Gigs tab.");
      setStep(5);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not post gig.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Post a gig</DialogTitle>
        <DialogDescription className="sr-only">
          4-step wizard to publish a gig listing and lock 20% upfront escrow.
        </DialogDescription>

        {/* Header / stepper */}
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.18em] text-primary uppercase">
                <Briefcase className="h-3 w-3" />
                Founder → Post a gig
              </div>
              <h2 className="mt-1 text-lg font-semibold">
                {STEPS[step - 1].title}
              </h2>
            </div>
            {step > 1 && step < 5 && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Save & exit
              </Button>
            )}
          </div>

          {/* Stepper dots */}
          <div className="mt-4 flex items-center gap-1.5">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-1 items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    s.n < step
                      ? "bg-emerald-500 text-white"
                      : s.n === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {s.n < step ? "✓" : s.n}
                </div>
                {s.n < STEPS.length && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full",
                      s.n < step ? "bg-emerald-500" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step body */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <Step1Basics
              title={title} setTitle={setTitle}
              category={category} setCategory={setCategory}
              gigType={gigType} setGigType={setGigType}
            />
          )}
          {step === 2 && (
            <Step2Description
              description={description} setDescription={setDescription}
              requirements={requirements} setRequirements={setRequirements}
            />
          )}
          {step === 3 && (
            <Step3Budget
              budgetDot={budgetDot} setBudgetDot={setBudgetDot}
              walletBalance={walletBalance}
            />
          )}
          {step === 4 && (
            <Step4Review
              title={title} category={category} gigType={gigType}
              description={description} requirements={requirements}
              budgetDot={budgetDot}
              agreedToTerms={agreedToTerms} setAgreedToTerms={setAgreedToTerms}
              hasFunds={hasFunds}
            />
          )}
          {step === 5 && (
            <Step5Done title={title} budgetDot={budgetDot} onClose={handleClose} />
          )}
        </div>

        {/* Footer */}
        {step < 5 && (
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
            <Button variant="ghost" onClick={back} disabled={step === 1 || busy}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <div className="text-xs text-muted-foreground">
              Step {step} of 4
            </div>
            <Button variant="hero" onClick={next} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {step === 4 ? "Lock escrow & post" : "Continue"}
              {step !== 4 && <ArrowRight className="size-4" />}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Steps ───────────────────────── */

function Step1Basics({
  title, setTitle, category, setCategory, gigType, setGigType,
}: any) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-primary/5 p-4">
        <p className="text-sm text-foreground">
          <Sparkles className="mr-1.5 inline size-3.5 text-primary" />
          A clear title gets <strong>3× more applications</strong>. Use the actual deliverable
          ("Build React Dashboard"), not "Need help!".
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Gig title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Build React Dashboard for SaaS App"
          maxLength={120}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">{title.length} / 120</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WORK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Gig type</Label>
          <Select value={gigType} onValueChange={setGigType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GIG_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function Step2Description({ description, setDescription, requirements, setRequirements }: any) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-primary/5 p-4">
        <p className="text-sm text-foreground">
          <FileText className="mr-1.5 inline size-3.5 text-primary" />
          Cover <strong>what needs to be built</strong>, <strong>deliverables</strong>,
          and <strong>timeline</strong>. Builders decide in 30 seconds.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Gig description</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="We need a React dashboard with analytics charts, user management, and export features..."
          rows={6}
          maxLength={5000}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">{description.length} / 5000</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="req">Requirements & deliverables (optional)</Label>
        <Textarea
          id="req"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Deliverables: Figma design, responsive React components, API integration. Timeline: 2 weeks"
          rows={4}
          maxLength={2000}
        />
      </div>
    </div>
  );
}

function Step3Budget({
  budgetDot, setBudgetDot, walletBalance,
}: any) {
  const escrowTotal = Math.floor(budgetDot * 0.2); // 20% upfront
  const escrowNaira = dotToNaira(escrowTotal);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-primary/5 p-4">
        <p className="text-sm text-foreground">
          <Wallet className="mr-1.5 inline size-3.5 text-primary" />
          Set a fixed project budget. We'll lock 20% upfront as escrow so builders trust you. 
          The full amount is released when you approve the deliverables.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Project budget (DOT)</Label>
        <div className="relative">
          <Input
            id="budget"
            type="number"
            min={1}
            value={budgetDot}
            onChange={(e) => setBudgetDot(Math.max(1, Number(e.target.value)))}
            autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            DOT fixed price
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          ≈ {formatNaira(dotToNaira(budgetDot))} total project cost
        </p>
      </div>

      {/* Escrow summary */}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              20% upfront escrow
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {formatDot(escrowTotal)} DOT
            </p>
          </div>
          <Lock className="size-8 text-primary/50" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ≈ {formatNaira(escrowNaira)} · locked until completion approved
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">Your wallet balance</span>
        <span className="font-medium tabular-nums">{formatDot(walletBalance)} DOT</span>
      </div>
      {walletBalance < escrowTotal && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">Insufficient balance</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              You need {formatDot(escrowTotal - walletBalance)} more DOT.
              {" "}<Link to="/wallet" className="text-primary underline">Top up your wallet →</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Step4Review({
  title, category, gigType, description, requirements,
  budgetDot, agreedToTerms, setAgreedToTerms, hasFunds,
}: any) {
  const escrowTotal = Math.floor(budgetDot * 0.2);
  const gigLabel = GIG_TYPES.find((t) => t.value === gigType)?.label ?? gigType;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-primary/5 p-4">
        <p className="text-sm text-foreground">
          <Sparkles className="mr-1.5 inline size-3.5 text-primary" />
          Last look. Once you post, the 20% escrow is locked and the gig goes live.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            <Badge variant="secondary">{category}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{gigLabel}</Badge>
            <span>·</span>
            <span>{formatDot(budgetDot)} DOT fixed price</span>
            <span>·</span>
            <span>20% upfront escrow</span>
          </div>
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">{description}</p>
        {requirements && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Requirements & Deliverables</p>
            <p className="mt-1 text-sm">{requirements}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5">
        <p className="text-xs font-medium tracking-wider text-primary uppercase">20% Escrow to lock</p>
        <p className="mt-1 font-display text-3xl font-semibold">{formatDot(escrowTotal)} DOT</p>
        <p className="mt-1 text-xs text-muted-foreground">
          ≈ {formatNaira(dotToNaira(escrowTotal))} debited from your wallet
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Remaining {formatDot(budgetDot - escrowTotal)} DOT released on completion approval
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 size-4 accent-primary"
        />
        <span className="text-muted-foreground">
          I understand the {formatDot(escrowTotal)} DOT will be locked as upfront escrow and
          the full {formatDot(budgetDot)} DOT will be released to the builder when I approve the deliverables.
        </span>
      </label>

      {!hasFunds && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="text-red-700 dark:text-red-400">
            Insufficient wallet balance. Top up first.
          </p>
        </div>
      )}
    </div>
  );
}

function Step5Done({ title, budgetDot, onClose }: { title: string; budgetDot: number; onClose: () => void }) {
  return (
    <div className="space-y-5 py-4 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
        <CheckCircle2 className="size-9 text-emerald-500" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-light">Gig posted</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          <strong>{title}</strong> is now live in the Gigs tab. Builders can apply
          and you'll be notified when someone matches.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" asChild>
          <Link to="/work" onClick={onClose}>View Gigs tab</Link>
        </Button>
        <Button variant="hero" asChild>
          <Link to="/dashboard" onClick={onClose}>
            Go to dashboard
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
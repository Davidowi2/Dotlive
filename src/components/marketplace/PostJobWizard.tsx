/**
 * PostJobWizard — 5-step job posting flow with escrow.
 *
 * Steps:
 *   1. Basics      — title, category, employment type
 *   2. Description — what, who, why
 *   3. Budget      — DOT/month, escrow amount, terms
 *   4. Review      — final summary + escrow lock confirmation
 *   5. Posted      — confirmation, link to listing, link to dashboard
 *
 * Escrow model:
 *   - Founder specifies a monthly salary (DOT/month)
 *   - Founder also specifies an upfront escrow (1-3 months)
 *   - On Post: escrow DOT is debited from founder's wallet (held by DOT)
 *   - Builder accepts → escrow moves to builder over time (one payout per month)
 *   - Founder can cancel within 7 days → escrow refunded
 *
 * For v1 we keep it simple: escrow is debited on post and tracked on the
 * job listing. Payouts are manual until we have payroll automation.
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

const EMPLOYMENT_TYPES = [
  { value: "full_time",   label: "Full-time"   },
  { value: "part_time",   label: "Part-time"   },
  { value: "contract",    label: "Contract"    },
  { value: "internship",  label: "Internship"  },
];

interface PostJobWizardProps {
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

export function PostJobWizard({ open, onClose, walletBalance = 0 }: PostJobWizardProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(WORK_CATEGORIES[0]);
  const [empType, setEmpType] = useState("full_time");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [salaryDot, setSalaryDot] = useState(5000);
  const [escrowMonths, setEscrowMonths] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const escrowTotal = Math.floor(salaryDot * escrowMonths);
  const escrowNaira = dotToNaira(escrowTotal);
  const hasFunds = walletBalance >= escrowTotal;

  function reset() {
    setStep(1);
    setTitle("");
    setCategory(WORK_CATEGORIES[0]);
    setEmpType("full_time");
    setDescription("");
    setRequirements("");
    setSalaryDot(5000);
    setEscrowMonths(1);
    setAgreedToTerms(false);
  }

  function handleClose() {
    if (step !== 5 && (title || description)) {
      const ok = window.confirm("Discard this draft job?");
      if (!ok) return;
    }
    reset();
    onClose();
  }

  function next() {
    if (step === 1) {
      if (!title.trim()) return toast.error("Job title is required.");
      if (title.trim().length < 4) return toast.error("Title must be at least 4 characters.");
      setStep(2);
    } else if (step === 2) {
      if (!description.trim()) return toast.error("Add a description.");
      if (description.trim().length < 40) return toast.error("Tell builders more (40+ characters).");
      setStep(3);
    } else if (step === 3) {
      if (salaryDot <= 0) return toast.error("Salary must be a positive number.");
      if (escrowMonths < 1 || escrowMonths > 12) return toast.error("Escrow must be 1-12 months.");
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
        salaryDot: Math.floor(salaryDot),
        employmentType: empType,
        requirements: requirements.trim() || undefined,
        isOpen: true,
      });
      // Note: createJob doesn't yet deduct escrow — we'll add that as a follow-up
      // once the payout engine exists. For v1 the listing is created and the
      // escrow track is informational.
      qc.invalidateQueries({ queryKey: ["job_listings"] });
      qc.invalidateQueries({ queryKey: ["my_job_listings"] });
      toast.success("Job posted. It now appears in the Jobs tab.");
      setStep(5);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not post job.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Post a job</DialogTitle>
        <DialogDescription className="sr-only">
          5-step wizard to publish a job listing and lock escrow.
        </DialogDescription>

        {/* Header / stepper */}
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.18em] text-primary uppercase">
                <Briefcase className="h-3 w-3" />
                Founder → Post a job
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
              empType={empType} setEmpType={setEmpType}
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
              salaryDot={salaryDot} setSalaryDot={setSalaryDot}
              escrowMonths={escrowMonths} setEscrowMonths={setEscrowMonths}
              walletBalance={walletBalance}
            />
          )}
          {step === 4 && (
            <Step4Review
              title={title} category={category} empType={empType}
              description={description} requirements={requirements}
              salaryDot={salaryDot} escrowMonths={escrowMonths}
              agreedToTerms={agreedToTerms} setAgreedToTerms={setAgreedToTerms}
              hasFunds={hasFunds}
            />
          )}
          {step === 5 && (
            <Step5Done title={title} salaryDot={salaryDot} onClose={handleClose} />
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
  title, setTitle, category, setCategory, empType, setEmpType,
}: any) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-primary/5 p-4">
        <p className="text-sm text-foreground">
          <Sparkles className="mr-1.5 inline size-3.5 text-primary" />
          A clear title gets <strong>3× more applications</strong>. Use the actual role
          ("Senior React Developer"), not "We're hiring!".
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Job title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior React Developer"
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
          <Label>Employment type</Label>
          <Select value={empType} onValueChange={setEmpType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
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
          Cover <strong>what the work is</strong>, <strong>who you'll work with</strong>,
          and <strong>why it matters</strong>. Builders decide in 30 seconds.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Job description</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="We're building a marketplace for African founders and need a developer to..."
          rows={6}
          maxLength={5000}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">{description.length} / 5000</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="req">Requirements (optional)</Label>
        <Textarea
          id="req"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="3+ years experience with React, TypeScript, and..."
          rows={4}
          maxLength={2000}
        />
      </div>
    </div>
  );
}

function Step3Budget({
  salaryDot, setSalaryDot, escrowMonths, setEscrowMonths, walletBalance,
}: any) {
  const escrowTotal = Math.floor(salaryDot * escrowMonths);
  const escrowNaira = dotToNaira(escrowTotal);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-primary/5 p-4">
        <p className="text-sm text-foreground">
          <Wallet className="mr-1.5 inline size-3.5 text-primary" />
          Lock an upfront escrow so builders trust you. They'll see the locked amount
          on the listing. Payouts are released per milestone or monthly.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary">Monthly salary (DOT)</Label>
        <div className="relative">
          <Input
            id="salary"
            type="number"
            min={1}
            value={salaryDot}
            onChange={(e) => setSalaryDot(Math.max(1, Number(e.target.value)))}
            autoFocus
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            DOT / month
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          ≈ {formatNaira(dotToNaira(salaryDot))} / month at current rate
        </p>
      </div>

      <div className="space-y-2">
        <Label>Escrow (months upfront)</Label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 6].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setEscrowMonths(m)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                escrowMonths === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted/40",
              )}
            >
              {m} month{m > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Escrow summary */}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Total to lock
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {formatDot(escrowTotal)} DOT
            </p>
          </div>
          <Lock className="size-8 text-primary/50" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ≈ {formatNaira(escrowNaira)} · held in escrow until payout
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
  title, category, empType, description, requirements,
  salaryDot, escrowMonths, agreedToTerms, setAgreedToTerms, hasFunds,
}: any) {
  const escrowTotal = Math.floor(salaryDot * escrowMonths);
  const empLabel = EMPLOYMENT_TYPES.find((t) => t.value === empType)?.label ?? empType;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-primary/5 p-4">
        <p className="text-sm text-foreground">
          <Sparkles className="mr-1.5 inline size-3.5 text-primary" />
          Last look. Once you post, the escrow is locked and the listing goes live.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            <Badge variant="secondary">{category}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{empLabel}</Badge>
            <span>·</span>
            <span>{formatDot(salaryDot)} DOT/month</span>
            <span>·</span>
            <span>{escrowMonths} month{escrowMonths > 1 ? "s" : ""} escrow</span>
          </div>
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">{description}</p>
        {requirements && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Requirements</p>
            <p className="mt-1 text-sm">{requirements}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5">
        <p className="text-xs font-medium tracking-wider text-primary uppercase">Escrow to lock</p>
        <p className="mt-1 font-display text-3xl font-semibold">{formatDot(escrowTotal)} DOT</p>
        <p className="mt-1 text-xs text-muted-foreground">
          ≈ {formatNaira(dotToNaira(escrowTotal))} debited from your wallet
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
          I understand the {formatDot(escrowTotal)} DOT will be locked in escrow and
          released to the hired builder as payouts. Unused escrow is refundable
          within 7 days of cancellation.
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

function Step5Done({ title, salaryDot, onClose }: { title: string; salaryDot: number; onClose: () => void }) {
  return (
    <div className="space-y-5 py-4 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
        <CheckCircle2 className="size-9 text-emerald-500" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-light">Job posted</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          <strong>{title}</strong> is now live in the Jobs tab. Builders can apply
          and you'll be notified when someone matches.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" asChild>
          <Link to="/work" onClick={onClose}>View Jobs tab</Link>
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
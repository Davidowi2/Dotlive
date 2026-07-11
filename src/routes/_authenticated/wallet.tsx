
interface WalletData {
  balance: number;
  pending?: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  createdAt: string;
}

interface KycData {
  tier?: string;
  withdrawalLimit?: number;
  verified?: boolean;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  bankName?: string;
  accountNumber?: string;
  createdAt: string;
}

import { dotApi } from "@/api/client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpRight,
  AlertCircle,
  ArrowDownLeft,
  Plus,
  Minus,
  Gift,
  Settings2,
  ShoppingBag,
  CalendarDays,
  CheckCircle2,
  Send,
  Copy,
  Check,
  Loader2,
  Wallet as WalletIcon,
    TrendingUp,
    TrendingDown,
    Lock,
  ChevronRight,
  } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/app/EmptyState";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  getBalance, getTransactions, transfer,
  requestWithdrawal, verifyBankAccount, type WithdrawalRequest,
} from "@/api/wallet";
import { getByDotId } from "@/api/users";
import { getStakes, createStake, unstake, claimRewards, type StakePosition } from "@/api/stakes";
import { getMyVenture } from "@/api/ventures";
import { getPaymentByReference, replayPayment } from "@/api/payments";
import { ApiError } from "@/types/api";
import { isFeatureEnabled } from "@/lib/feature-flags";
// Paystack server functions removed — wired via Render API when configured.
import {
  MIN_DEPOSIT_DOT,
  DOT_RATE_NGN,
  dotToNaira,
  formatDot,
  formatNaira,
} from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "DOT Wallet — DOT" }] }),
  component: WalletPage,
});

const TYPE_META: Record<
  string,
  {
    icon: typeof ArrowUpRight;
    tone: string;
    /** true = money in, false = money out */
    inbound: boolean;
  }
> = {
  Deposit: { icon: ArrowDownLeft, tone: "text-primary", inbound: true },
  Reward: { icon: Gift, tone: "text-gold", inbound: true },
  "Academy Reward": { icon: Gift, tone: "text-gold", inbound: true },
  Spend: { icon: ArrowUpRight, tone: "text-destructive", inbound: false },
  Transfer: { icon: ArrowUpRight, tone: "text-destructive", inbound: false },
  "Marketplace Spend": { icon: ShoppingBag, tone: "text-destructive", inbound: false },
  "Marketplace Earnings": { icon: ArrowDownLeft, tone: "text-primary", inbound: true },
  "Event Payment": { icon: CalendarDays, tone: "text-destructive", inbound: false },
  Refund: { icon: ArrowDownLeft, tone: "text-primary", inbound: true },
  "Admin Adjustment": { icon: Settings2, tone: "text-muted-foreground", inbound: true },
  "Admin Credit": { icon: Settings2, tone: "text-primary", inbound: true },
  "Stake Created": { icon: Lock, tone: "text-gold", inbound: true },
  "Unstaked": { icon: ArrowUpRight, tone: "text-primary", inbound: true },
  "Reward Claimed": { icon: Gift, tone: "text-gold", inbound: true },
  "Escrow Funded": { icon: Lock, tone: "text-primary", inbound: false },
  "Escrow Released": { icon: ArrowDownLeft, tone: "text-primary", inbound: true },
};

/* ── Date-grouping helpers ─────────────────────────────────────────── */

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateGroupKey(d: Date): string {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6); // "This week" = today + last 6 days

  const target = startOfDay(d);
  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  if (target.getTime() >= weekAgo.getTime()) return "This week";
  return "Earlier";
}

function WalletPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useDotAuth();

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: getBalance,
    staleTime: 15_000,
  });
  const balance = walletData?.balance ?? 0;
  const staked = walletData?.stakedBalance ?? 0;
  const locked = walletData?.lockedBalance ?? 0;
  const earnedLifetime = walletData?.earnedLifetime ?? 0;
  const burnedLifetime = walletData?.burnedLifetime ?? 0;
  const stakedLifetime = walletData?.stakedLifetime ?? 0;

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
    staleTime: 15_000,
  });

  // KYC status + withdrawal history
  useEffect(() => {
    (async () => {
      try {
        const { dotApi } = await import("@/api/client");
        const [kycRes, wRes] = await Promise.all([
          dotApi.get<{ kyc: KycData | null }>("/api/kyc/me"),
          dotApi.get<{ withdrawals: WithdrawalRequest[] }>("/api/wallet/withdrawals"),
        ]);
        setKyc(kycRes?.kyc ?? null);
        setWithdrawals(wRes?.withdrawals ?? []);
      } catch {}
    })();
  }, [user?.dotId]);

  const dotId = user?.dotId ?? null;
  const [amount, setAmount] = useState(MIN_DEPOSIT_DOT);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [receipt, setReceipt] = useState<{ dot: number; naira: number; reference: string } | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);
  const [kyc, setKyc] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankInfo, setBankInfo] = useState({ accountName: "", accountNumber: "", bankCode: "", bankName: "" });
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [stakes, setStakes] = useState<StakePosition[]>([]);
  const [stakesLoading, setStakesLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(2000);
  const [stakeBusy, setStakeBusy] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);

  async function refreshStakes() {
    setStakesLoading(true);
    try {
      const data = await getStakes();
      setStakes(data);
    } catch {}
    setStakesLoading(false);
  }

  async function handleCreateStake() {
    if (stakeAmount <= 0) return;
    if (stakeAmount > balance) {
      toast.error("Insufficient balance.");
      return;
    }
    setStakeBusy(true);
    setStakeError(null);
    try {
      await createStake({ amount: Math.floor(stakeAmount) });
      toast.success(`Staked ${formatDot(stakeAmount)} DOT`);
      setStakeOpen(false);
      setStakeAmount(2000);
      refreshStakes();
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["vantage"] });
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Stake failed";
      setStakeError(msg);
      toast.error(msg);
    } finally {
      setStakeBusy(false);
    }
  }

  async function handleUnstake(stakeId: string) {
    setStakeBusy(true);
    try {
      await unstake(stakeId);
      toast.success("Unstake initiated. Cooldown started.");
      refreshStakes();
      qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e: any) {
      toast.error(e instanceof Error ? e.message : "Unstake failed");
    } finally {
      setStakeBusy(false);
    }
  }

  async function handleClaim(stakeId: string) {
    setStakeBusy(true);
    try {
      const res = await claimRewards(stakeId);
      toast.success(`Claimed ${formatDot(Number(res.claimed))} DOT rewards`);
      refreshStakes();
      qc.invalidateQueries({ queryKey: ["wallet"] });
    } catch (e: any) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setStakeBusy(false);
    }
  }

  /* Last-30-day delta — derived from already-fetched transactions. */
  const last30Delta = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let delta = 0;
    for (const t of transactions) {
      const ts = new Date(t.createdAt).getTime();
      if (ts >= cutoff) delta += Number(t.amount) || 0;
    }
    return delta;
  }, [transactions]);

  function copyDotId() {
    if (!dotId) return;
    navigator.clipboard.writeText(dotId);
    setCopied(true);
    toast.success("DOT ID copied");
    setTimeout(() => setCopied(false), 1500);
  }

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["deposits"] });
  }, [qc]);

  // On return from Paystack, the URL has ?deposit=processing&ref=...
  // We can call /api/payments/:id/replay to force-check status and credit.
  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (ref) {
      const verifyAndCredit = async () => {
        try {
          toast.info("Verifying your deposit...");
          const payment = await getPaymentByReference(ref);
          if (payment && payment.status === "pending") {
            await replayPayment(payment.id);
            toast.success("Deposit credited successfully!");
          } else if (payment && payment.status === "completed") {
            toast.success("Deposit already credited!");
          }
          refresh();
        } catch (e: any) {
          console.error("Failed to verify deposit", e);
          toast.error("Failed to verify deposit");
        }
      };
      verifyAndCredit();
      // Clean the URL
      url.searchParams.delete("ref");
      url.searchParams.delete("deposit");
      window.history.replaceState({}, "", url.toString());
    }
  }, [refresh]);

  async function handleDeposit() {
    if (amount < MIN_DEPOSIT_DOT) {
      toast.error(`Minimum deposit is ${formatDot(MIN_DEPOSIT_DOT)} DOT`);
      return;
    }
    setBusy(true);
    try {
      const res = await dotApi.post<{
        authorization_url: string;
        reference: string;
        amountDot: number;
      }>("/api/payments/deposit", {
        amountDot: amount,
        callbackUrl: window.location.href.split("?")[0],
      });
      // Redirect to Paystack hosted checkout
      window.location.href = res.authorization_url;
    } catch (e: any) {
      const msg = e?.message ?? "Could not start payment";
      // The backend returns 503 if PAYSTACK_SECRET_KEY isn't set
      if (e?.code === "paystack_disabled" || msg.includes("Deposits aren't available right now")) {
        toast.error("Deposits aren't available right now. We'll notify you when they're back online.");
      } else {
        toast.error(msg);
      }
      setBusy(false);
    }
  }

  /* Group transactions for sectioned list. Hook MUST be called before any early return. */
  const groupedTransactions = useMemo(() => {
    const groups: Array<{ label: string; items: typeof transactions }> = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "This week", items: [] },
      { label: "Earlier", items: [] },
    ];
    for (const t of transactions) {
      const key = dateGroupKey(new Date(t.createdAt));
      const bucket = groups.find((g) => g.label === key) ?? groups[groups.length - 1];
      bucket.items.push(t);
    }
    return groups.filter((g) => g.items.length > 0);
  }, [transactions]);

  // Refresh stakes whenever the Stakes tab is rendered.
  // Cheap: only fires when the component mounts (page open) and when the user
  // explicitly retries after an error.
  useEffect(() => {
    refreshStakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (walletLoading) {
    return (
      <AppShell>
        <PageSkeleton.Header />
        <PageSkeleton.WalletHero />
        <div className="mt-10 space-y-2">
                    {kyc && kyc.status !== "approved" && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  <strong>KYC {kyc.status === "not_submitted" ? "required" : "pending"}:</strong>{" "}
                  {kyc.status === "not_submitted"
                    ? "Verify your identity to withdraw DOT."
                    : `Your ${kyc.tier} submission is under review.`}
                </span>
              </div>
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link to="/kyc">{kyc.status === "not_submitted" ? "Complete KYC" : "View status"}</Link>
              </Button>
            </div>
          )}
          <div className="h-6 w-40 rounded-md bg-muted" />
          <PageSkeleton.TransactionRows rows={5} />
        </div>
      </AppShell>
    );
  }

  const deltaUp = last30Delta >= 0;
  const DeltaIcon = deltaUp ? TrendingUp : TrendingDown;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Wallet"
        title="Your DOT balance"
        subtitle="Deposit, transfer, and track transactions"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="default">
                <Plus className="size-4" /> Deposit DOT
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deposit DOT</DialogTitle>
                <DialogDescription>
                  Minimum {formatDot(MIN_DEPOSIT_DOT)} DOT. 1 DOT = {formatNaira(DOT_RATE_NGN)}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label htmlFor="amount">Amount (DOT)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={MIN_DEPOSIT_DOT}
                  step={100}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  You'll pay {formatNaira(dotToNaira(amount || 0))}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[2000, 5000, 10000, 20000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(v)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        amount === v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {formatDot(v)}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="default" onClick={handleDeposit} disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Pay with Paystack
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {verifying && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm">
          <Loader2 className="size-4 animate-spin text-primary" /> Verifying your payment…
        </div>
      )}

      <PageIntent
        icon={<WalletIcon className="size-5" />}
        intent="Where is your DOT, and what can you do with it?"
        context="Activity, active stakes, milestone escrow, and settings — all in one place."
      />

      <Tabs defaultValue="activity" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="stakes">Stakes</TabsTrigger>
          <TabsTrigger value="escrow">Escrow</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

      <TabsContent value="activity" className="mt-4">
      <section className="mt-10">
        <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gold/5 p-6 shadow-soft sm:p-8">
          {/* Decorative gold rail */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold/70 via-gold to-gold/70"
          />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs tracking-editorial text-gold-foreground/80">
                <WalletIcon className="size-4 text-gold" />
                <span>Available balance</span>
              </div>
              <p className="mt-4 font-display text-5xl font-light tracking-tight text-foreground tabular sm:text-6xl">
                {formatDot(balance)}{" "}
                <span className="text-2xl font-medium text-muted-foreground">DOT</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground tabular">
                ≈ {formatNaira(dotToNaira(balance))}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Staked: {formatDot(staked)} DOT
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium">
                  <span className="size-1.5 rounded-full bg-gold" />
                  Locked: {formatDot(locked)} DOT
                </span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Earned lifetime: {formatDot(earnedLifetime)} DOT · Staked lifetime: {formatDot(stakedLifetime)} DOT · Burned: {formatDot(burnedLifetime)} DOT
              </p>
            </div>

            {/* 30-day delta */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                deltaUp
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              <DeltaIcon className="size-3" />
              {deltaUp ? "+" : ""}
              {formatDot(last30Delta)} DOT
              <span className="ml-1 text-muted-foreground font-normal">last 30 days</span>
            </div>
          </div>

          {/* DOT ID chip + copy */}
          {dotId && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={copyDotId}
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-gold/60 hover:bg-background"
                aria-label="Copy your DOT ID"
              >
                <span className="tracking-editorial text-gold-foreground/80">Your DOT ID</span>
                <span className="font-mono font-semibold">@{dotId}</span>
                {copied ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground" />
                )}
              </button>
              <span className="text-xs text-muted-foreground">
                Send to <span className="font-mono text-foreground/80">@{dotId}</span> to receive DOT instantly.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 1.5: Balance trend chart ─────────────────────── */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="tracking-editorial text-gold">Trend</span>
            <h2 className="mt-1 font-display text-xl font-light tracking-tight">
              Balance over time
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              How your DOT balance moved across your last {transactions.length || 0} transactions.
            </p>
          </div>
        </div>
        <BalanceTrend transactions={transactions} currentBalance={balance} />
      </section>

      {/* ── Section divider ───────────────────────────────────────── */}
      <div className="mt-10 border-t border-border" />

      {/* ── Section 2: Actions ────────────────────────────────────── */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-light tracking-tight">Quick actions</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Deposit via Paystack or send DOT to another member by their DOT ID.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Deposit — primary CTA (filled green) */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="group flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary p-5 text-left text-primary-foreground shadow-soft transition hover:shadow-glow hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
                    <ArrowDownToLine className="size-5" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-light">Deposit DOT</p>
                    <p className="text-xs text-primary-foreground/80">
                      Pay with Paystack · min {formatDot(MIN_DEPOSIT_DOT)} DOT
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-primary-foreground/90 group-hover:translate-x-0.5 transition-transform">
                  Fund →
                </span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deposit DOT</DialogTitle>
                <DialogDescription>
                  Minimum {formatDot(MIN_DEPOSIT_DOT)} DOT. 1 DOT = {formatNaira(DOT_RATE_NGN)}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label htmlFor="amount">Amount (DOT)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={MIN_DEPOSIT_DOT}
                  step={100}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  You'll pay {formatNaira(dotToNaira(amount || 0))}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[2000, 5000, 10000, 20000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(v)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        amount === v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {formatDot(v)}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="default" onClick={handleDeposit} disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Pay with Paystack
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {isFeatureEnabled("bank_withdrawals") && (
            <Card
              className="cursor-pointer hover:shadow-lg transition"
              onClick={() => setWithdrawOpen(true)}
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-center gap-3">
                  <ArrowDownToLine className="size-6" />
                  <div>
                    <div className="font-medium">Withdraw to bank</div>
                    <div className="text-xs text-muted-foreground">
                      Cash out DOT to a Nigerian bank account
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary">
                    Withdraw
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
          {!isFeatureEnabled("bank_withdrawals") && (
            <div className="group flex items-center justify-between gap-4 rounded-xl border border-dashed border-border bg-muted/30 p-5 opacity-80">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ArrowDownToLine className="size-5" />
                </span>
                <div>
                  <div className="font-medium">Withdraw to bank</div>
                  <div className="text-xs text-muted-foreground">Coming soon</div>
                </div>
              </div>
              <Lock className="size-5 text-muted-foreground" />
            </div>
          )}

          {/* Withdraw / Transfer — ghost */}
          <button
            type="button"
            onClick={() => setTransferOpen(true)}
            className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40 hover:bg-card/80 hover:shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Send className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg font-light">Withdraw / Send</p>
                <p className="text-xs text-muted-foreground">
                  Transfer instantly by DOT ID
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">
              Open →
            </span>
          </button>

          {/* Stake — entry into staking */}
          <button
            type="button"
            onClick={() => setStakeOpen(true)}
            className="group flex items-center justify-between gap-4 rounded-xl border border-gold/40 bg-gold/5 p-5 text-left transition hover:border-gold/60 hover:bg-gold/10 hover:shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
                <Lock className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg font-light">Stake DOT</p>
                <p className="text-xs text-muted-foreground">
                  Earn rewards on locked DOT · 14-day cooldown
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-gold group-hover:translate-x-0.5 transition-all">
              Start →
            </span>
          </button>
        </div>
      </section>

      {/* ── Section divider ───────────────────────────────────────── */}
      <div className="mt-10 border-t border-border" />

      {/* ── Section 3: Transactions ───────────────────────────────── */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-light tracking-tight">Transaction history</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your DOT movements — deposits, transfers, earnings, and refunds.
            </p>
          </div>
          {transactions.length > 0 && (
            <span className="text-xs text-muted-foreground tabular">
              {transactions.length} {transactions.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ArrowUpRight className="size-4" />
              </span>
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs text-muted-foreground">
                Your deposits, transfers, and earnings will appear here.
              </p>
            </div>
          ) : (
            <div>
              {groupedTransactions.map((group, gi) => (
                <div key={group.label}>
                  {/* Group header */}
                  <div className="flex items-center gap-3 bg-muted/30 px-5 py-2 border-b border-border">
                    <span className="text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
                      {group.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 tabular">
                      {group.items.length}
                    </span>
                    <span className="ml-auto h-px flex-1 bg-border" />
                  </div>

                  {/* Rows with alternating background */}
                  <ul>
                    {group.items.map((t, idx) => {
                      const meta = TYPE_META[t.type] ?? TYPE_META["Admin Adjustment"];
                      const positive = (meta.inbound || Number(t.amount) >= 0) && Number(t.amount) >= 0;
                      const amountNum = Number(t.amount) || 0;
                      return (
                        <li
                          key={t.id}
                          className={cn(
                            "flex items-center gap-4 px-5 py-4 border-b border-border last:border-0",
                            idx % 2 === 1 && "bg-muted/30",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg",
                              positive
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive",
                              meta.tone === "text-gold" &&
                                "bg-gold/10 text-gold",
                            )}
                          >
                            <meta.icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {t.description || t.type}
                            </p>
                            <p className="text-xs text-muted-foreground tabular">
                              {t.type} · {new Date(t.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "font-display text-sm font-medium tabular",
                                positive ? "text-primary" : "text-destructive",
                                meta.tone === "text-gold" && "text-gold",
                              )}
                            >
                              {positive ? "+" : ""}
                              {formatDot(Math.abs(amountNum))} DOT
                            </p>
                            <p className="text-xs text-muted-foreground tabular">
                              {formatNaira(dotToNaira(Math.abs(amountNum)))}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Spacer between groups (visual rhythm) */}
                  {gi < groupedTransactions.length - 1 && (
                    <div className="h-2 bg-background/40" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      </TabsContent>

      {/* ── Stakes tab ─────────────────────────────────────── */}
      <TabsContent value="stakes" className="mt-4">
        <WalletStakesTab
          stakes={stakes}
          loading={stakesLoading}
          busy={stakeBusy}
          error={stakeError}
          onCreate={() => setStakeOpen(true)}
          onUnstake={handleUnstake}
          onClaim={handleClaim}
        />
      </TabsContent>

      {/* ── Escrow tab ─────────────────────────────────────── */}
      <TabsContent value="escrow" className="mt-4">
        <WalletEscrowTab ventureId={null} />
      </TabsContent>

      {/* ── Settings tab ───────────────────────────────────── */}
      <TabsContent value="settings" className="mt-4">
        <WalletSettingsTab
          kyc={kyc}
          onWithdraw={() => setWithdrawOpen(true)}
        />
      </TabsContent>
      </Tabs>

      <Dialog open={stakeOpen} onOpenChange={setStakeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stake DOT</DialogTitle>
            <DialogDescription>
              Lock DOT to earn 12% APY. 14-day cooldown before you can unstake.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="stake-amount">Amount (DOT)</Label>
            <Input
              id="stake-amount"
              type="number"
              min={100}
              step={100}
              value={stakeAmount}
              onChange={(e) => setStakeAmount(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatDot(balance)} DOT
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStakeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStake} disabled={stakeBusy}>
              {stakeBusy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Stake
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <InlineTransferForm
            balance={balance}
            myDotId={dotId}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ["wallet"] });
              qc.invalidateQueries({ queryKey: ["transactions"] });
              setTransferOpen(false);
            }}
            onClose={() => setTransferOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {isFeatureEnabled("bank_withdrawals") && (
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent>
            {kyc?.status !== "approved" ? (
              <>
                <DialogHeader>
                  <DialogTitle>Verify KYC to withdraw</DialogTitle>
                  <DialogDescription>
                    DOT withdrawals to a Nigerian bank require identity verification.
                    You currently have <strong>{kyc?.status ?? "no"}</strong> KYC.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
                    Cancel
                  </Button>
                  <Button asChild>
                    <Link to="/kyc">Start KYC</Link>
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <InlineWithdrawForm
                balance={balance}
                kycTier={kyc?.tier}
                withdrawalLimit={kyc?.withdrawalLimit ?? 0}
                onSuccess={() => {
                  qc.invalidateQueries({ queryKey: ["wallet"] });
                  qc.invalidateQueries({ queryKey: ["transactions"] });
                  qc.invalidateQueries({ queryKey: ["withdrawals"] });
                  setWithdrawOpen(false);
                }}
                onClose={() => setWithdrawOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Payment receipt</DialogTitle>
            <DialogDescription className="text-center">Your DOT wallet has been funded.</DialogDescription>
          </DialogHeader>
          {receipt && (
            <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <Row label="DOT credited" value={`${formatDot(receipt.dot)} DOT`} />
              <Row label="Amount paid" value={formatNaira(receipt.naira)} />
              <Row label="Reference" value={receipt.reference} mono />
              <Row label="Date" value="—" />
            </div>
          )}
          <DialogFooter>
            <Button variant="default" className="w-full" onClick={() => setReceipt(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

/* ── Inline Transfer Form ──────────────────────────────── */

function InlineTransferForm({
  balance,
  myDotId,
  onSuccess,
  onClose,
}: {
  balance: number;
  myDotId?: string | null;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [toDotId, setToDotId] = useState("");
  const [amount, setAmount] = useState(100);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [recipient, setRecipient] = useState<{ name: string | null } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  async function lookupRecipient(dotId: string) {
    if (dotId.length < 3) {
      setRecipient(null);
      return;
    }
    setLookingUp(true);
    try {
      const user = await getByDotId(dotId.trim());
      setRecipient({ name: user.name });
    } catch {
      setRecipient(null);
    } finally {
      setLookingUp(false);
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (amount > balance) {
      toast.error("Insufficient balance.");
      return;
    }
    if (amount <= 0) {
      toast.error("Amount must be positive.");
      return;
    }
    setBusy(true);
    try {
      await transfer(toDotId.trim(), Math.floor(amount), note.trim() || undefined);
      toast.success(`${formatDot(amount)} DOT sent!`);
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Transfer failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Transfer DOT</DialogTitle>
        <DialogDescription>
          Send DOT to another user by their DOT ID. Your balance: {formatDot(balance)} DOT
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleTransfer} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="to-dot-id">Recipient DOT ID</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              @
            </span>
            <Input
              id="to-dot-id"
              value={toDotId}
              onChange={(e) => {
                setToDotId(e.target.value);
                lookupRecipient(e.target.value);
              }}
              placeholder="swift-founder-24abc1"
              className="pl-7 font-mono"
            />
          </div>
          {lookingUp && (
            <p className="text-xs text-muted-foreground">Looking up…</p>
          )}
          {!lookingUp && recipient && (
            <p className="text-xs text-primary">@{toDotId} · {recipient.name ?? "Unknown user"} ✓</p>
          )}
          {!lookingUp && toDotId.length >= 3 && !recipient && (
            <p className="text-xs text-destructive">DOT ID not found</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="transfer-amount">Amount (DOT)</Label>
          <Input
            id="transfer-amount"
            type="number"
            min={1}
            max={balance}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            ≈ {formatNaira(dotToNaira(amount))}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transfer-note">Note (optional)</Label>
          <Input
            id="transfer-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For the logo design…"
            maxLength={200}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={busy || !toDotId.trim() || amount <= 0}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            <Send className="size-4" /> Send {amount > 0 ? formatDot(amount) : ""} DOT
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/* ────────────────────────── Inline Withdraw Form ────────────────────────── */

function InlineWithdrawForm({
  balance,
  kycTier,
  withdrawalLimit,
  onSuccess,
  onClose,
}: {
  balance: number;
  kycTier?: string;
  withdrawalLimit: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState<number>(Math.min(5000, balance));
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankOpen, setBankOpen] = useState(false);

  // Pull a static list of common Nigerian banks. Backend has /api/wallet/banks
  // for full list; this avoids an extra round-trip when the dialog opens.
  const BANKS: { code: string; name: string }[] = [
    { code: "044", name: "Access Bank" },
    { code: "023", name: "Citibank Nigeria" },
    { code: "063", name: "Diamond Bank" },
    { code: "050", name: "Ecobank Nigeria" },
    { code: "070", name: "Fidelity Bank" },
    { code: "011", name: "First Bank of Nigeria" },
    { code: "214", name: "First City Monument Bank" },
    { code: "058", name: "Guaranty Trust Bank" },
    { code: "030", name: "Heritage Bank" },
    { code: "301", name: "Jaiz Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "526", name: "Kuda Bank" },
    { code: "100", name: "Lotus Bank" },
    { code: "221", name: "Mainstreet Bank" },
    { code: "999992", name: "Moniepoint MFB" },
    { code: "999991", name: "OPay Digital Services" },
    { code: "999993", name: "Palmpay" },
    { code: "076", name: "Polaris Bank" },
    { code: "101", name: "Providus Bank" },
    { code: "125", name: "Rubies MFB" },
    { code: "215", name: "Unity Bank" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
  ];

  // Auto-verify the account name once both bankCode + 10 digits are filled
  useEffect(() => {
    if (bankCode.length === 3 && accountNumber.length === 10) {
      setVerifying(true);
      setError(null);
      // Simple offline fallback: use the user's dotId if /verify-bank-account fails
      // (the backend may not be wired yet; the user can still edit later).
      verifyBankAccount(bankCode, accountNumber)
        .then((res) => {
          setAccountName(res.accountName);
        })
        .catch(() => {
          setAccountName("");
          // Soft fallback: just allow submission; admin can verify manually
        })
        .finally(() => setVerifying(false));
    } else {
      setAccountName("");
    }
  }, [bankCode, accountNumber]);

  const filteredBanks = useMemo(() => {
    const q = bankName.toLowerCase();
    if (!q) return BANKS.slice(0, 8);
    return BANKS.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 8);
  }, [bankName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (amount <= 0) return setError("Amount must be positive.");
    if (amount > balance) return setError("Insufficient balance.");
    if (withdrawalLimit > 0 && amount > withdrawalLimit) {
      return setError(
        `Your current KYC tier allows up to ${formatDot(withdrawalLimit)} DOT per withdrawal.`,
      );
    }
    if (!bankCode || !bankName) return setError("Pick a bank.");
    if (!/^\d{10}$/.test(accountNumber)) {
      return setError("Account number must be 10 digits.");
    }
    setBusy(true);
    try {
      await requestWithdrawal({
        amount: Math.floor(amount),
        bankCode,
        bankName,
        accountNumber,
        accountName: accountName || "(to be verified)",
      });
      toast.success(
        `Withdrawal request for ${formatDot(amount)} DOT submitted for review.`,
      );
      onSuccess();
    } catch (err: any) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Withdrawal failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Withdraw to bank</DialogTitle>
        <DialogDescription>
          Cash out DOT to your Nigerian bank account. Balance: {formatDot(balance)} DOT
          {withdrawalLimit > 0 && (
            <>
              {" "}· KYC {kycTier?.replace("tier", "") ?? ""}: up to {formatDot(withdrawalLimit)} DOT
            </>
          )}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="wd-amount">Amount (DOT)</Label>
          <Input
            id="wd-amount"
            type="number"
            min={1}
            max={Math.min(balance, withdrawalLimit || balance)}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>≈ {formatNaira(dotToNaira(amount))}</span>
            <div className="flex gap-2">
              {[1000, 5000, 10000].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-muted"
                  onClick={() => setAmount(Math.min(v, balance))}
                >
                  {v >= 1000 ? `${v / 1000}k` : v}
                </button>
              ))}
              <button
                type="button"
                className="rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-muted"
                onClick={() =>
                  setAmount(Math.min(balance, withdrawalLimit || balance))
                }
              >
                Max
              </button>
            </div>
          </div>
        </div>

        {/* Bank picker */}
        <div className="space-y-2">
          <Label htmlFor="wd-bank">Bank</Label>
          <div className="relative">
            <Input
              id="wd-bank"
              autoComplete="off"
              value={bankName}
              onFocus={() => setBankOpen(true)}
              onChange={(e) => {
                setBankName(e.target.value);
                setBankOpen(true);
              }}
              placeholder="Search bank (e.g. GTBank, Zenith)"
            />
            {bankOpen && filteredBanks.length > 0 && (
              <div className="absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                {filteredBanks.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setBankCode(b.code);
                      setBankName(b.name);
                      setBankOpen(false);
                    }}
                  >
                    <span>{b.name}</span>
                    <span className="text-xs text-muted-foreground">{b.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Account number */}
        <div className="space-y-2">
          <Label htmlFor="wd-account">Account number</Label>
          <Input
            id="wd-account"
            type="text"
            inputMode="numeric"
            maxLength={10}
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="0123456789"
            autoComplete="off"
          />
          {verifying && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Verifying account…
            </p>
          )}
          {!verifying && accountName && (
            <p className="text-xs text-primary">✓ {accountName}</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
          Withdrawals are reviewed and processed within 1–2 business days.
          You'll receive a notification when funds are sent.
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={
              busy ||
              verifying ||
              amount <= 0 ||
              !bankCode ||
              accountNumber.length !== 10
            }
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            <ArrowDownToLine className="size-4" />
            Withdraw {amount > 0 ? formatDot(amount) : ""} DOT
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/* ── Balance trend — pure SVG sparkline, no chart lib needed ─────── */

function BalanceTrend({
  transactions,
  currentBalance,
}: {
  transactions: Transaction[];
  currentBalance: number;
}) {
  // Walk transactions from oldest to newest, compute running balance.
  // Assume the most recent tx ended at currentBalance, then step backwards
  // by reversing the sign: prior = current - delta.
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  // Build running balance from oldest → newest by re-applying each delta
  // to a seed. We don't know the seed (balance BEFORE all these txs) but we
  // can recover it: balance_after_last = seed + sum(deltas) = currentBalance,
  // so seed = currentBalance - sum(deltas).
  const deltaSum = sorted.reduce(
    (acc, t) => acc + (Number(t.amount) || 0),
    0,
  );
  const seed = currentBalance - deltaSum;

  const points = sorted.map((t, i) => {
    const running = seed + sorted.slice(0, i + 1).reduce((a, x) => a + Number(x.amount), 0);
    return { date: t.createdAt, value: running };
  });
  // Append "now" point so the line ends at currentBalance
  points.push({ date: new Date().toISOString(), value: currentBalance });

  if (points.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No transaction history yet — your balance trend will appear here after your first transfer.
      </div>
    );
  }

  // SVG sparkline
  const W = 800;
  const H = 180;
  const pad = 8;
  const xs = points.map((_, i) => pad + (i * (W - pad * 2)) / (points.length - 1));
  const minV = Math.min(...points.map((p) => p.value));
  const maxV = Math.max(...points.map((p) => p.value));
  const range = Math.max(maxV - minV, 1);
  const ys = points.map((p) => H - pad - ((p.value - minV) / range) * (H - pad * 2));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${path} L${xs[xs.length - 1]},${H} L${xs[0]},${H} Z`;

  const isUp = points[points.length - 1].value >= points[0].value;
  const change = points[points.length - 1].value - points[0].value;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
            Net change over {points.length - 1} tx
          </p>
          <p
            className={cn(
              "mt-1 font-display text-2xl font-light tabular",
              isUp ? "text-primary" : "text-destructive",
            )}
          >
            {isUp ? "+" : ""}
            {formatDot(change)} DOT
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Now</p>
          <p className="mt-1 font-display text-2xl font-light tabular text-foreground">
            {formatDot(currentBalance)}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-40 w-full"
        >
          <defs>
            <linearGradient id="bal-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className={cn(isUp ? "text-primary" : "text-destructive")}>
            <path d={area} fill="url(#bal-grad)" />
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={xs[xs.length - 1]}
              cy={ys[ys.length - 1]}
              r="4"
              fill="currentColor"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ── Tab: Stakes ────────────────────────────────────────────── */

function WalletStakesTab({
  stakes,
  loading,
  busy,
  error,
  onCreate,
  onUnstake,
  onClaim,
}: {
  stakes: StakePosition[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  onCreate: () => void;
  onUnstake: (id: string) => void;
  onClaim: (id: string) => void;
}) {
  const totalStaked = stakes
    .filter((s) => s.status === "active" || s.status === "unstaking")
    .reduce((acc, s) => acc + Number(s.amount), 0);
  const activeCount = stakes.filter((s) => s.status === "active").length;
  const totalReward = stakes.reduce(
    (acc, s) => acc + Number(s.rewardClaimed) + Number(s.rewardAccrued),
    0,
  );

  return (
    <section className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total staked"
          value={`${formatDot(totalStaked)} DOT`}
          accent="primary"
        />
        <SummaryCard
          label="Active positions"
          value={String(activeCount)}
          accent="teal"
        />
        <SummaryCard
          label="Lifetime rewards"
          value={`${formatDot(totalReward)} DOT`}
          accent="gold"
        />
      </div>

      {/* New-stake CTA + error */}
      <div className="flex flex-col gap-2 rounded-2xl border border-gold/40 bg-gold/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-base font-light">Stake more DOT</p>
          <p className="text-xs text-muted-foreground">
            Earn 12% APY · 14-day cooldown · manual claim
          </p>
        </div>
        <Button variant="default" onClick={onCreate} disabled={busy}>
          <Lock className="size-4" /> New stake
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Position list */}
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : stakes.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="No active stakes"
          description="Start a stake above to earn 12% APY with a 14-day cooldown."
        />
      ) : (
        <ul className="space-y-3">
          {stakes.map((s) => (
            <WalletStakeRow
              key={s.id}
              stake={s}
              busy={busy}
              onUnstake={() => onUnstake(s.id)}
              onClaim={() => onClaim(s.id)}
            />
          ))}
        </ul>
      )}

      <div className="text-center">
        <Link to="/stakes" className="text-xs text-muted-foreground hover:text-foreground">
          Open full stake manager →
        </Link>
      </div>
    </section>
  );
}

function WalletStakeRow({
  stake,
  busy,
  onUnstake,
  onClaim,
}: {
  stake: StakePosition & { lockEndsAt?: string; apyPct?: number };
  busy: boolean;
  onUnstake: () => void;
  onClaim: () => void;
}) {
  const lockEnds = stake.lockEndsAt
    ? new Date(stake.lockEndsAt)
    : new Date(new Date(stake.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000);
  const days = Math.max(
    0,
    Math.ceil((lockEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
  const canUnstake = stake.status === "active" && days === 0;
  const claimable = Number(stake.rewardAccrued) > 0;
  const canClaim = canUnstake && claimable;

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-display text-lg font-light">
            {formatDot(Number(stake.amount))} DOT · {stake.apyPct}% APY
          </p>
          <p className="text-xs text-muted-foreground">
            Status: {stake.status} · started{" "}
            {new Date(stake.createdAt).toLocaleDateString()}
            {stake.status === "active" && days > 0 ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Lock className="size-3" /> {days}d until unlock
              </span>
            ) : null}
          </p>
          {Number(stake.rewardAccrued) > 0 ? (
            <p className="text-xs text-gold">
              Accrued: {formatDot(Number(stake.rewardAccrued))} DOT
            </p>
          ) : null}
        </div>
        {stake.status === "active" ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canUnstake || busy}
              onClick={onUnstake}
            >
              Unstake
            </Button>
            <Button size="sm" disabled={!canClaim || busy} onClick={onClaim}>
              Claim
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "primary" | "teal" | "gold";
}) {
  const ring = {
    primary: "ring-primary/20 bg-primary/5",
    teal: "ring-teal/20 bg-teal/5",
    gold: "ring-gold/20 bg-gold/5",
  }[accent];
  const text = {
    primary: "text-primary",
    teal: "text-teal",
    gold: "text-gold",
  }[accent];
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-border p-4 ring-1 ring-inset ${ring}`}
    >
      <span
        className={`flex size-10 items-center justify-center rounded-lg bg-card ${text}`}
      >
        <Lock className="size-5" />
      </span>
      <div>
        <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
          {label}
        </p>
        <p className="font-display text-lg font-light tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/* ── Tab: Escrow ───────────────────────────────────────────── */

type EscrowSummary = {
  ventureId: string;
  totalFunded: number;
  totalPayout: number;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    fundedAmount: string;
    payoutAmount: string | null;
    achievedAt: string | null;
    targetDate: string | null;
  }>;
  byStatus: Record<string, number>;
};

function WalletEscrowTab({ ventureId }: { ventureId: string | null }) {
  const { data: venture, isLoading: ventureLoading } = useQuery({
    queryKey: ["my-venture"],
    queryFn: getMyVenture,
  });
  const id = ventureId ?? venture?.id ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["venture-escrow", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await dotApi.get<EscrowSummary>(
        `/api/ventures/${id}/escrow`,
      );
      return res;
    },
  });

  if (ventureLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!id) {
    return (
      <EmptyState
        icon={Lock}
        title="No venture yet"
        description="Create a venture to set up milestone escrow. Funds are released to you as you hit each milestone."
        action={
          <Button asChild>
            <Link to="/ventures">Create a venture →</Link>
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load escrow"
        description="The escrow service is unreachable. Try again in a moment."
        action={
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!data || data.milestones.length === 0) {
    return (
      <EmptyState
        icon={Lock}
        title="No escrow milestones"
        description="Milestones will appear here once you define them on your venture."
        action={
          <Button asChild>
            <Link to="/ventures">Manage milestones →</Link>
          </Button>
        }
      />
    );
  }

  const pendingPayout = data.milestones
    .filter((m) => m.status !== "paid" && m.status !== "released")
    .reduce((acc, m) => acc + Number(m.payoutAmount ?? m.fundedAmount ?? 0), 0);
  const releasedPayout = data.totalPayout;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Total funded"
          value={`${formatDot(data.totalFunded)} DOT`}
          accent="primary"
        />
        <SummaryCard
          label="Pending release"
          value={`${formatDot(pendingPayout)} DOT`}
          accent="teal"
        />
        <SummaryCard
          label="Released"
          value={`${formatDot(releasedPayout)} DOT`}
          accent="gold"
        />
        <SummaryCard
          label="Milestones"
          value={String(data.milestones.length)}
          accent="primary"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-display font-semibold">Milestone escrow</h3>
        <ul className="mt-3 divide-y divide-border">
          {data.milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  Status: {m.status}
                  {m.targetDate
                    ? ` · target ${new Date(m.targetDate).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular-nums">
                  {formatDot(Number(m.payoutAmount ?? m.fundedAmount ?? 0))} DOT
                </p>
                <p className="text-xs text-muted-foreground">payout</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Tab: Settings (KYC + Withdraw) ─────────────────────────── */

function WalletSettingsTab({
  kyc,
  onWithdraw,
}: {
  kyc: any;
  onWithdraw: () => void;
}) {
  return (
    <section className="space-y-6">
      {/* KYC status */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
              KYC status
            </p>
            <p className="mt-1 font-display text-xl font-light">
              {kyc?.status === "approved"
                ? `Verified · tier ${kyc?.tier?.replace("tier", "") ?? "1"}`
                : kyc?.status === "pending"
                  ? "Under review"
                  : "Not submitted"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kyc?.status === "approved"
                ? `You can withdraw up to ${formatDot(kyc?.withdrawalLimit ?? 0)} DOT per request.`
                : kyc?.status === "pending"
                  ? "Your submission is being reviewed. We'll notify you when it's done."
                  : "Verify your identity to withdraw DOT to a Nigerian bank."}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/kyc">
              {kyc?.status === "approved" ? "View" : kyc?.status === "pending" ? "View status" : "Start KYC"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Withdraw */}
      {!isFeatureEnabled("bank_withdrawals") ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center">
          <p className="text-sm text-muted-foreground">Bank withdrawals are currently disabled.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                Withdraw to bank
              </p>
              <p className="mt-1 font-display text-xl font-light">Cash out DOT</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Send DOT to a Nigerian bank account. KYC required.
              </p>
            </div>
            <Button onClick={onWithdraw} variant="default" size="sm">
              <ArrowDownToLine className="size-4" /> Withdraw
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
import { useState, useEffect, useCallback, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpRight,
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
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useDotAuth } from "@/contexts/DotAuthContext";
import { getBalance, getTransactions, transfer } from "@/api/wallet";
import { getByDotId } from "@/api/users";
import { ApiError } from "@/types/api";
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

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
    staleTime: 15_000,
  });

  const dotId = user?.dotId ?? null;
  const [amount, setAmount] = useState(MIN_DEPOSIT_DOT);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [receipt, setReceipt] = useState<{ dot: number; naira: number; reference: string } | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

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

  // Paystack integration is not wired — show "coming soon" in deposit UI.

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
  }, [qc]);

  // Handle return from Paystack hosted checkout (?reference=... &trxref=...)
  // Paystack return handler disabled

  async function handleDeposit() {
    if (amount < MIN_DEPOSIT_DOT) {
      toast.error(`Minimum deposit is ${formatDot(MIN_DEPOSIT_DOT)} DOT`);
      return;
    }
    setBusy(true);
    try {
      // Paystack integration not wired — show friendly message.
      toast.info("Deposits via Paystack are temporarily disabled. Coming soon.");
      return;
    } catch (e) {
      // Surface a friendly message if Paystack / server-fn isn't wired yet.
      const msg = e instanceof Error ? e.message : "Could not start payment";
      if (msg.includes("PAYSTACK") || msg.includes("Payment provider")) {
        toast.error("Deposits are temporarily disabled. Please contact support.");
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

  if (walletLoading || txLoading) {
    return (
      <AppShell>
        <PageSkeleton.Header />
        <PageSkeleton.WalletHero />
        <div className="mt-10 space-y-2">
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

      {/* ── Section 1: Balance ─────────────────────────────────────── */}
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

      {/* ── Transfer dialog ── */}
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
              <Row label="Date" value={new Date().toLocaleString()} />
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
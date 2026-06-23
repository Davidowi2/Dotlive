import { useState, useEffect, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Wallet, ArrowDownToLine, Loader2, Plus, Minus, Gift, Settings2, ShoppingBag, CalendarDays, CheckCircle2, Send, Copy, Check } from "lucide-react";
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
import { initPaystackPayment, verifyPaystackPayment } from "@/lib/paystack.functions";
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

const TYPE_META: Record<string, { icon: typeof Plus; tone: string }> = {
  Deposit: { icon: ArrowDownToLine, tone: "text-primary" },
  Reward: { icon: Gift, tone: "text-gold" },
  "Academy Reward": { icon: Gift, tone: "text-gold" },
  Spend: { icon: Minus, tone: "text-destructive" },
  Transfer: { icon: Send, tone: "text-foreground" },
  "Marketplace Spend": { icon: ShoppingBag, tone: "text-destructive" },
  "Marketplace Earnings": { icon: Plus, tone: "text-primary" },
  "Event Payment": { icon: CalendarDays, tone: "text-destructive" },
  Refund: { icon: Plus, tone: "text-primary" },
  "Admin Adjustment": { icon: Settings2, tone: "text-muted-foreground" },
  "Admin Credit": { icon: Settings2, tone: "text-primary" },
};

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

  function copyDotId() {
    if (!dotId) return;
    navigator.clipboard.writeText(dotId);
    setCopied(true);
    toast.success("DOT ID copied");
    setTimeout(() => setCopied(false), 1500);
  }

  const initFn = useServerFn(initPaystackPayment);
  const verifyFn = useServerFn(verifyPaystackPayment);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
  }, [qc]);

  // Handle return from Paystack hosted checkout (?reference=... &trxref=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;

    setVerifying(true);
    verifyFn({ data: { reference } })
      .then((res) => {
        if (res.status === "success") {
          setReceipt({ dot: res.dotAmount, naira: dotToNaira(res.dotAmount), reference });
          toast.success(`Wallet funded with ${formatDot(res.dotAmount)} DOT`);
          refresh();
        } else {
          toast.error("Payment was not completed. You were not charged any DOT.");
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Verification failed"))
      .finally(() => {
        setVerifying(false);
        navigate({ to: "/wallet", replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeposit() {
    if (amount < MIN_DEPOSIT_DOT) {
      toast.error(`Minimum deposit is ${formatDot(MIN_DEPOSIT_DOT)} DOT`);
      return;
    }
    setBusy(true);
    try {
      const { authorizationUrl } = await initFn({
        data: { dotAmount: Math.floor(amount), callbackUrl: `${window.location.origin}/wallet` },
      });
      window.location.href = authorizationUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start payment");
      setBusy(false);
    }
  }

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

  return (
    <AppShell>
      <PageHeader
        title="DOT Wallet"
        subtitle={`Your internal ecosystem credits · 1 DOT = ${formatNaira(DOT_RATE_NGN)}`}
      />

      {verifying && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm">
          <Loader2 className="size-4 animate-spin text-primary" /> Verifying your payment…
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 sm:col-span-2 [background-image:var(--gradient-primary)]">
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <Wallet className="size-5" />
            <span className="text-sm font-medium">Available balance</span>
          </div>
          <p className="mt-4 font-display text-5xl font-bold text-primary-foreground">
            {formatDot(balance)} <span className="text-2xl font-medium">DOT</span>
          </p>
          <p className="mt-1 text-sm text-primary-foreground/80">≈ {formatNaira(dotToNaira(balance))}</p>
          {dotId && (
            <button
              onClick={copyDotId}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary-foreground/20"
            >
              <span className="text-primary-foreground/70">Your DOT ID</span>
              <span className="font-mono font-semibold">{dotId}</span>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          )}
        </div>
        <div className="flex flex-col justify-center gap-3 rounded-2xl border border-border bg-card p-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="w-full">
                <ArrowDownToLine className="size-4" /> Deposit DOT
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
                        "rounded-full border px-3 py-1 text-sm",
                        amount === v ? "border-primary bg-primary/10 text-primary" : "border-border",
                      )}
                    >
                      {formatDot(v)}
                    </button>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="hero" onClick={handleDeposit} disabled={busy}>
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Pay with Paystack
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="w-full" onClick={() => setTransferOpen(true)}>
              <Send className="size-4" /> Transfer DOT
            </Button>
          <p className="text-center text-xs text-muted-foreground">
            Send instantly by DOT ID · fund via Paystack
          </p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold">Transaction history</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {transactions.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((t) => {
              const meta = TYPE_META[t.type] ?? TYPE_META["Admin Adjustment"];
              const positive = Number(t.amount) >= 0;
              return (
                <li key={t.id} className="flex items-center gap-4 p-4">
                  <span className={cn("flex size-9 items-center justify-center rounded-lg bg-muted", meta.tone)}>
                    <meta.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description || t.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.type} · {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={cn("font-display text-sm font-semibold", positive ? "text-primary" : "text-destructive")}>
                    {positive ? "+" : ""}
                    {formatDot(Number(t.amount))} DOT
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Transfer dialog ── */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <InlineTransferForm
            balance={balance}
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
            <Button variant="hero" className="w-full" onClick={() => setReceipt(null)}>
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
  onSuccess,
  onClose,
}: {
  balance: number;
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
    if (dotId.length < 3) { setRecipient(null); return; }
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
    if (amount > balance) { toast.error("Insufficient balance."); return; }
    if (amount <= 0) { toast.error("Amount must be positive."); return; }
    setBusy(true);
    try {
      await transfer(toDotId.trim(), Math.floor(amount), note.trim() || undefined);
      toast.success(`${formatDot(amount)} DOT sent!`);
      onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message
        : err instanceof Error ? err.message
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
          <Input
            id="to-dot-id"
            value={toDotId}
            onChange={(e) => { setToDotId(e.target.value); lookupRecipient(e.target.value); }}
            placeholder="swift-founder-24abc1"
          />
          {lookingUp && <p className="text-xs text-muted-foreground">Looking up…</p>}
          {!lookingUp && recipient && (
            <p className="text-xs text-primary">{recipient.name ?? "Unknown user"} ✓</p>
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
          <p className="text-xs text-muted-foreground">≈ {formatNaira(dotToNaira(amount))}</p>
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
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="hero" disabled={busy || !toDotId.trim() || amount <= 0}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            <Send className="size-4" /> Send {amount > 0 ? formatDot(amount) : ""} DOT
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

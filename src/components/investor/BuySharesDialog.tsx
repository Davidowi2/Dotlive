/**
 * BuySharesDialog — modal for investing in a founder's venture.
 *
 * Opens from:
 *   - Public founder profile (`/founder/$id`)
 *   - Investor portal (`/investor`)
 *
 * Shows:
 *   - Share price (kobo + NGN equivalent)
 *   - Shares available
 *   - Quantity input with quick-buttons (1, 10, 50, 100)
 *   - Total cost preview (DOT + NGN)
 *   - Wallet balance check
 *   - Confirm / Cancel
 *
 * On confirm:
 *   - POST /api/investments with { founderId, shares }
 *   - On success: invalidate portfolio + founder profile queries
 *   - On 402 (insufficient): show "Deposit first" CTA
 *   - On error: inline message
 */
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Coins, ShoppingCart, AlertCircle, CheckCircle2, Loader2,
  ExternalLink, Wallet, ArrowRight, Sparkles, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { dotApi } from "@/api/client";
import { buyShares, getMyInvestments } from "@/api/investments";
import { formatDot, formatNaira, dotToNaira, KOBO_PER_DOT } from "@/lib/constants";
import { toast } from "sonner";

export interface VentureForInvestment {
  founderId: string;
  founderName: string | null;
  ventureName: string;
  sharePriceKobo: number;
  sharesAvailable: number;
}

export function BuySharesDialog({
  open,
  onOpenChange,
  venture,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  venture: VentureForInvestment | null;
}) {
  const { user } = useDotAuth();
  const qc = useQueryClient();

  const [shares, setShares] = useState<number>(1);

  // Wallet balance query
  const walletQ = useQueryLite(`/api/wallet`, { enabled: !!user && open });

  const pricePerShareDot = useMemo(() => {
    if (!venture) return 0;
    return Math.round((venture.sharePriceKobo / KOBO_PER_DOT) * 100) / 100;
  }, [venture]);

  const pricePerShareNaira = useMemo(() => {
    if (!venture) return 0;
    return Math.round(venture.sharePriceKobo / 100);
  }, [venture]);

  const totalDot = useMemo(() => pricePerShareDot * shares, [pricePerShareDot, shares]);
  const totalNaira = useMemo(() => dotToNaira(totalDot), [totalDot]);

  const balanceDot = walletQ.data?.balance ?? 0;
  const insufficientBalance = totalDot > balanceDot;
  const exceedsAvailable = venture ? shares > venture.sharesAvailable : false;
  const invalidShares = shares < 1;

  const buyMut = useMutation({
    mutationFn: () => buyShares({ founderId: venture!.founderId, shares }),
    onSuccess: (result) => {
      toast.success(
        `Bought ${result.shares} shares of ${venture!.ventureName} for ${formatDot(Number(result.totalPaidDot))} DOT`,
      );
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["founder-profile"] });
      qc.invalidateQueries({ queryKey: ["investor", "ventures"] });
      getMyInvestments().catch(() => {}); // warm cache
      onOpenChange(false);
      setShares(1);
    },
    onError: (e: any) => {
      const msg = e?.message ?? "Could not complete purchase";
      toast.error(msg);
    },
  });

  if (!venture) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-primary" />
            Buy shares
          </DialogTitle>
          <DialogDescription>
            You're investing in <strong>{venture.ventureName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pricing card */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Share price
              </span>
              <Badge variant="outline">{venture.sharesAvailable} available</Badge>
            </div>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
              {formatNaira(pricePerShareNaira)}
            </p>
            <p className="text-xs text-muted-foreground">
              ≈ {formatDot(pricePerShareDot)} DOT per share
            </p>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              How many shares?
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShares((n) => Math.max(1, n - 1))}
                disabled={shares <= 1}
              >
                −
              </Button>
              <Input
                type="number"
                min={1}
                max={venture.sharesAvailable}
                value={shares}
                onChange={(e) => setShares(Math.max(1, Number(e.target.value) || 1))}
                className="text-center font-display text-lg tabular-nums"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShares((n) => Math.min(venture.sharesAvailable, n + 1))}
                disabled={shares >= venture.sharesAvailable}
              >
                +
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[1, 10, 50, 100].map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShares(n)}
                  disabled={n > venture.sharesAvailable}
                  className="h-7 px-2 text-xs"
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-medium tracking-widest uppercase text-primary">
              You'll pay
            </p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
              {formatDot(totalDot)} DOT
            </p>
            <p className="text-xs text-muted-foreground">
              ≈ {formatNaira(totalNaira)} · {shares} × {formatNaira(pricePerShareNaira)}
            </p>
          </div>

          {/* Wallet balance */}
          <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-background/40 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="size-3.5" />
              <span>Your balance</span>
            </div>
            <span className="font-display text-sm font-semibold tabular-nums">
              {formatDot(balanceDot)} DOT
            </span>
          </div>

          {/* Warnings */}
          {invalidShares && (
            <p className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="size-3.5" />
              Enter at least 1 share.
            </p>
          )}
          {exceedsAvailable && (
            <p className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="size-3.5" />
              Only {venture.sharesAvailable} shares are available.
            </p>
          )}
          {insufficientBalance && !exceedsAvailable && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
              <p className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-3.5" />
                You need {formatDot(totalDot - balanceDot)} more DOT.
              </p>
              <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-amber-600">
                <Link to="/wallet">
                  Deposit NGN via Paystack
                  <ExternalLink className="size-3" />
                </Link>
              </Button>
            </div>
          )}

          {/* Founder note */}
          <div className="rounded-lg border border-dashed border-border bg-background/40 p-3 text-xs text-muted-foreground">
            <Sparkles className="mr-1 inline size-3 text-primary" />
            Shares are priced by the founder. Your wallet pays the founder's wallet directly — no Paystack fee, instant settlement.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={() => buyMut.mutate()}
              disabled={insufficientBalance || exceedsAvailable || invalidShares || buyMut.isPending}
            >
              {buyMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Coins className="size-4" />
              )}
              Buy {shares} share{shares === 1 ? "" : "s"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Tiny wallet query helper (avoids importing useQuery everywhere) */
import { useQuery } from "@tanstack/react-query";
function useQueryLite<T = any>(path: string, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["wallet", path],
    enabled: opts.enabled ?? true,
    queryFn: async () => {
      try {
        return await dotApi.get<T>(path);
      } catch {
        return { balance: 0 } as T;
      }
    },
    staleTime: 30_000,
  });
}
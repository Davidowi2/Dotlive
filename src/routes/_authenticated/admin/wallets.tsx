/**
 * /admin/wallets — Admin transfer (DOT between users) + wallet overview.
 */

import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight, Loader2, AlertTriangle, CheckCircle2, Search, Users,
} from "lucide-react";

import { useDotAuth } from "@/contexts/DotAuthContext";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { adminTransfer, getTokenOps, getTokenStats, type TokenOperation } from "@/api/admin-tools";
import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/admin/wallets")({
  head: () => ({ meta: [{ title: "Wallets — Admin — DOT" }] }),
  component: AdminWalletsPage,
});

function AdminWalletsPage() {
  const [fromDotId, setFromDotId] = useState("");
  const [toDotId, setToDotId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [userLookup, setUserLookup] = useState<{ id: string; field: "from" | "to" } | null>(null);
  const [lookupResult, setLookupResult] = useState<any>(null);

  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["admin", "token-stats"],
    queryFn: getTokenStats,
  });

  const { data: opsData, refetch: refetchOps } = useQuery({
    queryKey: ["admin", "token-ops", "transfers"],
    queryFn: () => getTokenOps({ op: "admin_transfer", limit: 30 }),
    refetchInterval: 15_000,
  });

  // Lookup user when dotId changes
  useEffect(() => {
    if (!userLookup) return;
    const id = userLookup.field === "from" ? fromDotId : toDotId;
    if (!id || id.length < 5) { setLookupResult(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await dotApi.get(`/api/users/lookup?dotId=${encodeURIComponent(id)}`);
        setLookupResult(res);
      } catch { setLookupResult(null); }
    }, 500);
    return () => clearTimeout(t);
  }, [fromDotId, toDotId, userLookup]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Amount must be > 0");
    if (!fromDotId || !toDotId) return toast.error("Both from and to DOT IDs required");
    if (fromDotId === toDotId) return toast.error("Cannot transfer to same user");
    if (!reason || reason.length < 5) return toast.error("Reason required (min 5 chars) for audit");
    setSubmitting(true);
    try {
      const res = await adminTransfer({
        fromDotId: fromDotId.trim(),
        toDotId: toDotId.trim(),
        amountDot: amt,
        reason: reason.trim(),
      });
      setLastResult(res);
      toast.success(`Transferred ${amt.toLocaleString()} DOT`);
      setAmount("");
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin"] });
      refetchOps();
    } catch (err: any) {
      toast.error(err?.message ?? "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  }

  const recentTransfers = opsData?.operations ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Wallets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transfer DOT between users by their DOT ID. Every transfer is audited.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Circulating</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{stats?.display.circulating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Minted</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{Number(stats?.totalMintedDot ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Burned</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{Number(stats?.totalBurnedDot ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowLeftRight className="size-4" /> Admin transfer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              Admin-only. Every transfer is logged to <code>admin_audit_log</code> AND <code>token_operations</code>.
              Use only for customer support, refunds, or as authorized by the client.
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>From DOT ID</Label>
                <Input
                  value={fromDotId}
                  onChange={(e) => { setFromDotId(e.target.value); setUserLookup({ id: e.target.value, field: "from" }); }}
                  placeholder="DOT-XXXX-NNNN or brave-works-26pc4x9l"
                  required
                />
                {userLookup?.field === "from" && lookupResult?.user && (
                  <div className="rounded-md bg-muted/30 px-3 py-2 text-xs">
                    <strong>{lookupResult.user.name ?? "(no name)"}</strong> — {lookupResult.user.email}
                    <div className="text-muted-foreground">Balance: {Number(lookupResult.user.balance ?? 0).toLocaleString()} DOT</div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>To DOT ID</Label>
                <Input
                  value={toDotId}
                  onChange={(e) => { setToDotId(e.target.value); setUserLookup({ id: e.target.value, field: "to" }); }}
                  placeholder="DOT-XXXX-NNNN or swift-rogue-21abc4de"
                  required
                />
                {userLookup?.field === "to" && lookupResult?.user && (
                  <div className="rounded-md bg-muted/30 px-3 py-2 text-xs">
                    <strong>{lookupResult.user.name ?? "(no name)"}</strong> — {lookupResult.user.email}
                    <div className="text-muted-foreground">Balance: {Number(lookupResult.user.balance ?? 0).toLocaleString()} DOT</div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount (DOT)</Label>
                <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" required />
                <div className="text-xs text-muted-foreground">
                  ≈ ₦{amount ? (Number(amount) * 15).toLocaleString() : "0"} (at ₦15/DOT)
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason (audited)</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Refund for failed service" required minLength={5} />
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-xs text-muted-foreground">
                Verify both DOT IDs above. Transfer is atomic — both wallets update together or not at all.
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeftRight className="size-4" />}
                Transfer
              </Button>
            </div>
          </form>

          {lastResult && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              <div>
                <strong>Transferred {lastResult.transferred.toLocaleString()} DOT</strong>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                  <div>From new balance: <strong>{lastResult.from.newBalance.toLocaleString()} DOT</strong></div>
                  <div>To new balance: <strong>{lastResult.to.newBalance.toLocaleString()} DOT</strong></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transfers</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransfers.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No transfers yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">From → To</th>
                    <th className="px-3 py-2 text-left">Actor</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransfers.map((op: TokenOperation) => (
                    <tr key={op.id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {new Date(op.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {Number(op.amountDot).toLocaleString()} DOT
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {op.fromUserId?.slice(0, 8) ?? "—"} → {op.toUserId?.slice(0, 8) ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{op.actorEmail ?? "system"}</td>
                      <td className="px-3 py-2 text-xs">{op.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

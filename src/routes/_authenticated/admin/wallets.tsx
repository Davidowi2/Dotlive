/**
 * Admin Wallets Page
 *
 * - Search users
 * - Adjust balance (credit / debit) with reason
 * - All actions audit-logged
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftRight, Loader2, AlertTriangle, CheckCircle2, Search, Wallet } from "lucide-react";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { adminTransfer, getTokenOps, getTokenStats } from "@/api/admin-tools";
import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/admin/wallets")({
  head: () => ({ meta: [{ title: "Wallets — Admin — DOT" }] }),
  component: AdminWalletsPage,
});

type UserLookup = { id: string; email: string; name: string | null; balance: number };

function AdminWalletsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [userLookup, setUserLookup] = useState<UserLookup | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["admin", "token-stats"],
    queryFn: getTokenStats,
  });

  doSearch(search);

  async function doSearch(q: string) {
    if (!q || q.length < 3) {
      setUserLookup(null);
      return;
    }
    try {
      const res = await dotApi.get<UserLookup>(`/api/admin/users/lookup?q=${encodeURIComponent(q)}`);
      setUserLookup(res);
    } catch {
      setUserLookup(null);
    }
  }

  async function adjustBalance() {
    if (!userLookup) return toast.error("Find a user first");
    const amount = Number(delta);
    if (!Number.isFinite(amount) || amount === 0) return toast.error("Enter a non-zero DOT amount");
    if (!reason.trim() || reason.trim().length < 5) return toast.error("Reason required (min 5 chars)");
    setSubmitting(true);
    try {
      await dotApi.post(`/api/admin/users/${userLookup.id}/adjust-wallet`, {
        amountDot: amount,
        reason: reason.trim(),
      });
      toast.success(`Wallet ${amount > 0 ? "credited" : "debited"} by ${Math.abs(amount)} DOT`);
      setDelta("");
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Adjust failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Wallets</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search users and adjust wallet balances with audit logging.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Circulating</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{stats?.circulating ?? Number(stats?.circulatingSupplyDot ?? 0).toLocaleString() ?? "—"}</div>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4" /> Adjust balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Search user</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, or DOT ID..."
                autoComplete="off"
              />
              {userLookup && (
                <div className="rounded-md bg-muted/30 px-3 py-2 text-xs">
                  <strong>{userLookup.name ?? "(no name)"}</strong> — {userLookup.email}
                  <div className="text-muted-foreground">Current balance: {Number(userLookup.balance ?? 0).toLocaleString()} DOT</div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Amount DOT (positive = credit, negative = debit)</Label>
              <Input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="1000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason (audit log)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Refund for failed service" minLength={5} required />
          </div>
          <Button onClick={adjustBalance} disabled={submitting || !userLookup}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Adjust balance
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

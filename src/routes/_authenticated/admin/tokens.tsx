/**
 * /admin/tokens — Token admin full control panel.
 *
 * Token economics configuration, rate editing, mint form, and ops history.
 */

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, Loader2, Plus, AlertTriangle, TrendingUp, Settings2, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  getTokenStats,
  getTokenOps,
  mintTokens,
  getPlatformConfig,
  updatePlatformConfig,
  type TokenStats,
  type TokenOperation,
  type PlatformConfigEntry,
} from "@/api/admin-tools";

export const Route = createFileRoute("/_authenticated/admin/tokens")({
  head: () => ({ meta: [{ title: "Tokens — Admin — DOT" }] }),
  component: AdminTokensPage,
});

const HIGH_IMPACT_KEYS = new Set([
  "dot_ngn_rate",
  "max_supply_cap",
  "signup_bonus",
  "founder_cost",
  "investor_cost",
  "community_leader_cost",
  "capital_partner_cost",
]);

function AdminTokensPage() {
  const qc = useQueryClient();
  const [toDotId, setToDotId] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [mintReason, setMintReason] = useState("");
  const [minting, setMinting] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "token-stats"],
    queryFn: getTokenStats,
    refetchInterval: 30_000,
  });
  const { data: opsData } = useQuery({
    queryKey: ["admin", "token-ops", "all"],
    queryFn: () => getTokenOps({ limit: 100 }),
    refetchInterval: 30_000,
  });
  const { data: configData } = useQuery({
    queryKey: ["admin", "platform-config"],
    queryFn: getPlatformConfig,
    refetchInterval: 30_000,
  });
  const config: PlatformConfigEntry[] = (configData as any)?.config ?? [];

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editReason, setEditReason] = useState("");
  const [confirmValue, setConfirmValue] = useState("");

  const capPct = Number(stats?.display?.capReachedPercent ?? 0);
  const danger = capPct > 90;
  const warn = capPct > 70;
  const ops = opsData?.operations ?? [];

  async function handleMint(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(mintAmount);
    if (!amt || amt <= 0) return toast.error("Amount must be > 0");
    if (!toDotId) return toast.error("Destination DOT ID required");
    if (!mintReason || mintReason.length < 5) return toast.error("Reason required (min 5 chars) for audit");
    setMinting(true);
    try {
      const res = await mintTokens({ toDotId: toDotId.trim(), amountDot: amt, reason: mintReason.trim() });
      toast.success(`Minted ${amt.toLocaleString()} DOT → ${res.to.userId.slice(0, 8)}`);
      setMintAmount("");
      setMintReason("");
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Mint failed");
    } finally {
      setMinting(false);
    }
  }

  function openEditor(entry: PlatformConfigEntry) {
    setEditingKey(entry.key);
    setEditValue(String(entry.value ?? ""));
    setEditReason("");
    setConfirmValue("");
  }

  async function saveConfig(entry: PlatformConfigEntry) {
    const raw = editValue.trim();
    if (!raw) return toast.error("Value required");
    const expectedConfirm = HIGH_IMPACT_KEYS.has(entry.key) ? "CONFIRM" : raw;
    if (confirmValue !== expectedConfirm) {
      return toast.error(HIGH_IMPACT_KEYS.has(entry.key) ? "Type CONFIRM to proceed" : "Values do not match");
    }
    if (!editReason.trim() || editReason.trim().length < 3) {
      return toast.error("Reason required (min 3 chars) for audit");
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return toast.error("Enter a valid number");
    }
    try {
      await updatePlatformConfig({
        key: entry.key,
        value: parsed,
        reason: editReason.trim(),
      });
      toast.success(`Updated ${entry.key}`);
      setEditingKey(null);
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Update failed");
    }
  }

  if (statsLoading || !stats) {
    return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  const renderConfigItem = (entry: PlatformConfigEntry) => {
    const isHighImpact = HIGH_IMPACT_KEYS.has(entry.key);
    const isEditing = editingKey === entry.key;

    if (isEditing) {
      return (
        <div key={entry.key} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{entry.label}</p>
              <p className="text-xs text-muted-foreground">{entry.description}</p>
            </div>
            {isHighImpact && (
              <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/5 px-2 py-1 text-[10px] font-medium text-destructive">
                <ShieldAlert className="size-3" /> High impact
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New value</Label>
              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder={String(entry.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason {isHighImpact && <span className="text-destructive">*</span>}</Label>
              <Input value={editReason} onChange={(e) => setEditReason(e.target.value)} placeholder="Why is this changing?" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{isHighImpact ? "Type CONFIRM to proceed" : "Confirm change"}</Label>
            <Input value={confirmValue} onChange={(e) => setConfirmValue(e.target.value)} placeholder={isHighImpact ? "CONFIRM" : editValue} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveConfig(entry)}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>Cancel</Button>
          </div>
        </div>
      );
    }

    return (
      <div key={entry.key} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div>
          <p className="font-medium text-sm">{entry.label}</p>
          <p className="text-xs text-muted-foreground">{entry.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular text-sm font-medium">{String(entry.value)}</span>
          <Button size="sm" variant="outline" onClick={() => openEditor(entry)}>
            <Settings2 className="size-3.5" /> Edit
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Token Supply</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          DOT has a hard cap of <strong>100 billion</strong> tokens. Total supply = minted − burned.
        </p>
      </div>

      {/* Cap visualization */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>Cap usage</span>
              <span className={cn(danger ? "text-destructive" : warn ? "text-amber-500" : "text-primary")}>
                {stats.display.capReachedPercent}
              </span>
            </div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full transition-all", danger ? "bg-destructive" : warn ? "bg-amber-500" : "bg-primary")}
                style={{ width: `${Math.min(capPct, 100)}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-muted-foreground">Max</div>
                <div className="font-semibold tabular-nums">{stats.display.maxSupply}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Circulating</div>
                <div className="font-semibold tabular-nums text-primary">{stats.circulating ?? Number(stats.circulatingSupplyDot).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Remaining</div>
                <div className="font-semibold tabular-nums">{stats.display.remaining}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Breakdown</div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Total minted (all time)</dt>
                <dd className="font-mono tabular-nums">{Number(stats.totalMintedDot).toLocaleString()} DOT</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Total burned (all time)</dt>
                <dd className="font-mono tabular-nums">{Number(stats.totalBurnedDot).toLocaleString()} DOT</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Net circulating</dt>
                <dd className="font-mono tabular-nums font-semibold">{Number(stats.circulatingSupplyDot).toLocaleString()} DOT</dd>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <dt className="text-muted-foreground">Cap headroom</dt>
                <dd className={cn("font-mono tabular-nums font-semibold", danger && "text-destructive")}>
                  {Number(stats.remainingDot).toLocaleString()} DOT
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Mint form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" /> Mint new DOT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
            <Coins className="mt-0.5 size-4 text-primary shrink-0" />
            <div>
              Mints new DOT to a user, increasing <code>total_minted_dot</code>.
              Refused if the mint would exceed the 100B cap.
            </div>
          </div>
          <form onSubmit={handleMint} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>To DOT ID</Label>
                <Input value={toDotId} onChange={(e) => setToDotId(e.target.value)} placeholder="brave-works-26pc4x9l" required />
              </div>
              <div className="space-y-2">
                <Label>Amount (DOT)</Label>
                <Input type="number" min={1} value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="1000" required />
                <div className="text-xs text-muted-foreground">
                  New total would be {((Number(stats.totalMintedDot) + (Number(mintAmount) || 0)) / 1e9).toFixed(4)}B
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input value={mintReason} onChange={(e) => setMintReason(e.target.value)} placeholder="e.g. Builder grant" required minLength={5} />
              </div>
            </div>
            <Button type="submit" disabled={minting}>
              {minting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Mint DOT
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Platform config editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="size-4" /> Platform configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
            <AlertTriangle className="mt-0.5 size-4 text-amber-500 shrink-0" />
            <div>
              High-impact changes require typing <code>CONFIRM</code>. All changes are audit-logged.
            </div>
          </div>
          <div className="space-y-2">
            {config.map((entry) => renderConfigItem(entry))}
          </div>
        </CardContent>
      </Card>

      {/* Operations history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operations history</CardTitle>
        </CardHeader>
        <CardContent>
          {ops.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No operations yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Op</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">From → To</th>
                    <th className="px-3 py-2 text-left">Actor</th>
                    <th className="px-3 py-2 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {ops.map((op: TokenOperation) => (
                    <tr key={op.id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(op.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            op.operation === "mint" && "bg-primary/10 text-primary",
                            op.operation === "burn" && "bg-destructive/10 text-destructive",
                            op.operation === "admin_transfer" && "bg-amber-500/10 text-amber-700",
                          )}
                        >
                          {op.operation}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{Number(op.amountDot).toLocaleString()} DOT</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {op.fromUserId?.slice(0, 8) ?? "(mint)"} → {op.toUserId?.slice(0, 8) ?? "(burn)"}
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

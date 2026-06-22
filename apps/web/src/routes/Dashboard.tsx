// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Wallet, TrendingUp, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { walletApi } from "../api/wallet.js";
import { rolesApi, type RoleUpgrade } from "../api/roles.js";
import { useAuth } from "../contexts/AuthContext.js";
import { ApiError } from "../api/client.js";
import { AppShell } from "../components/AppShell.js";

export function DashboardPage() {
  const { user, primaryRole, hasRole } = useAuth();
  const qc = useQueryClient();
  const balance = useQuery({ queryKey: ["wallet"], queryFn: walletApi.balance });
  const requirements = useQuery({
    queryKey: ["roles", "requirements"],
    queryFn: () => rolesApi.list().then((r) => r.requirements),
    staleTime: 5 * 60_000,
  });

  const upgrade = useMutation({
    mutationFn: (role: RoleUpgrade["role"]) => rolesApi.upgrade(role),
    onSuccess: ({ user: updated }) => {
      toast.success(`You are now a ${updated.roles.find((r: string) => r !== "builder") ?? "new role"}!`);
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 402) {
        toast.error(
          "Not enough DOT for this upgrade. Complete gigs or assessments to earn more.",
          { duration: 5000 }
        );
      } else if (err instanceof ApiError && err.status === 409) {
        toast.error("You already have this role.");
      } else {
        toast.error(err instanceof Error ? err.message : "Upgrade failed.");
      }
    },
  });

  return (
    <AppShell>
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
        Welcome back, {user?.name ?? "builder"}
      </div>
      <h1 className="font-display text-4xl font-bold">
        {primaryRole && primaryRole !== "builder"
          ? `Your ${primaryRole} journey`
          : "Your venture starts here."}
      </h1>

      {/* Wallet card */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
            <Wallet className="size-4 text-[var(--primary)]" /> Wallet
          </div>
          <p className="mt-2 font-display text-4xl font-bold text-[var(--primary)]">
            {balance.data ? balance.data.balance.toLocaleString() : "—"}{" "}
            <span className="text-base text-[var(--text-muted)]">DOT</span>
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            ₦{balance.data ? (balance.data.balance * 10).toLocaleString() : "—"}
          </p>
        </div>
        <StatCard icon={TrendingUp} label="Vantage Point" value="0" sub="Run assessment to earn +" />
        <StatCard icon={Sparkles} label="DOT earned this week" value="0" sub="+0 from gigs" />
      </div>

      {/* Role upgrade cards */}
      {requirements.data
        ?.filter((r) => !hasRole(r.role as any))
        .map((r) => (
          <UpgradeCard
            key={r.role}
            role={r.role}
            cost={r.dotCost}
            body={r.description ?? ""}
            balance={balance.data?.balance ?? 0}
            busy={upgrade.isPending && upgrade.variables === r.role}
            disabled={upgrade.isPending}
            onUpgrade={() => upgrade.mutate(r.role)}
          />
        ))}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Link
          to="/wallet"
          className="glass flex items-center justify-between rounded-2xl p-6 hover:border-[var(--primary)]/40"
        >
          <div>
            <h3 className="font-display text-lg font-semibold">Wallet & transfers</h3>
            <p className="text-sm text-[var(--text-muted)]">See balance, send DOT, view history.</p>
          </div>
          <ArrowRight className="size-5 text-[var(--text-muted)]" />
        </Link>
        <Link
          to="/work"
          className="glass flex items-center justify-between rounded-2xl p-6 hover:border-[var(--primary)]/40"
        >
          <div>
            <h3 className="font-display text-lg font-semibold">DOT Work — marketplace</h3>
            <p className="text-sm text-[var(--text-muted)]">Find gigs, post jobs, ship work.</p>
          </div>
          <ArrowRight className="size-5 text-[var(--text-muted)]" />
        </Link>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
        <Icon className="size-4 text-[var(--primary)]" /> {label}
      </div>
      <p className="mt-2 font-display text-4xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}

function UpgradeCard({
  role,
  cost,
  body,
  balance,
  busy,
  disabled,
  onUpgrade,
}: {
  role: string;
  cost: number;
  body: string;
  balance: number;
  busy: boolean;
  disabled: boolean;
  onUpgrade: () => void;
}) {
  const canAfford = balance >= cost;
  return (
    <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-[var(--primary)]/40 bg-[var(--primary)]/5 p-5">
      <div className="flex-1">
        <p className="font-display text-lg font-semibold text-[var(--primary)]">
          Upgrade to {role.replace(/_/g, " ")} · {cost.toLocaleString()} DOT
        </p>
        <p className="text-sm text-[var(--text-muted)]">{body}</p>
        {!canAfford && (
          <p className="mt-1 text-xs text-[var(--gold)]">
            You have {balance.toLocaleString()} DOT —{" "}
            {(cost - balance).toLocaleString()} more needed.
          </p>
        )}
      </div>
      <button onClick={onUpgrade} disabled={disabled || busy} className="btn-primary disabled:opacity-50">
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Upgrade"}
      </button>
    </div>
  );
}

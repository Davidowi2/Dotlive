import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Wallet, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { walletApi } from "../api/wallet.js";
import { useAuth } from "../contexts/AuthContext.js";

export function DashboardPage() {
  const { user, primaryRole, hasRole, logout } = useAuth();
  const balance = useQuery({ queryKey: ["wallet"], queryFn: walletApi.balance });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-soft)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-lg font-bold">
            <span className="text-[var(--primary)]">●</span> dotlive
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--text-muted)]">
              {user?.name ?? user?.email} · {primaryRole ?? "builder"}
            </span>
            <button onClick={logout} className="text-[var(--text-muted)] hover:text-[var(--text)]">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
          Welcome back, {user?.name ?? "builder"}
        </div>
        <h1 className="font-display text-4xl font-bold">Your venture starts here.</h1>

        {/* Wallet card */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
              <Wallet className="size-4 text-[var(--primary)]" /> Wallet
            </div>
            <p className="mt-2 font-display text-4xl font-bold text-[var(--primary)]">
              {balance.data ? balance.data.balance.toLocaleString() : "—"} <span className="text-base text-[var(--text-muted)]">DOT</span>
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              ₦{balance.data ? (balance.data.balance * 10).toLocaleString() : "—"}
            </p>
          </div>
          <StatCard icon={TrendingUp} label="Vantage Point" value="0" sub="Run assessment to earn +" />
          <StatCard icon={Sparkles} label="DOT earned this week" value="0" sub="+0 from gigs" />
        </div>

        {/* Role upgrade cards */}
        {!hasRole("founder") && <UpgradeCard role="founder" cost={2000} body="List your venture, post jobs, raise capital." />}
        {!hasRole("investor") && <UpgradeCard role="investor" cost={10000} body="Browse ventures, save founders, request meetings." />}
        {!hasRole("community_leader") && <UpgradeCard role="community_leader" cost={1000} body="Build and grow a community." />}
        {!hasRole("vendor") && <UpgradeCard role="vendor" cost={5000} body="Offer services to the ecosystem." />}

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Link to="/wallet" className="glass flex items-center justify-between rounded-2xl p-6 hover:border-[var(--primary)]/40">
            <div>
              <h3 className="font-display text-lg font-semibold">Wallet & transfers</h3>
              <p className="text-sm text-[var(--text-muted)]">See balance, send DOT, view history.</p>
            </div>
            <ArrowRight className="size-5 text-[var(--text-muted)]" />
          </Link>
          <Link to="/work" className="glass flex items-center justify-between rounded-2xl p-6 hover:border-[var(--primary)]/40">
            <div>
              <h3 className="font-display text-lg font-semibold">DOT Work — marketplace</h3>
              <p className="text-sm text-[var(--text-muted)]">Find gigs, post jobs, ship work.</p>
            </div>
            <ArrowRight className="size-5 text-[var(--text-muted)]" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
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

function UpgradeCard({ role, cost, body }: { role: string; cost: number; body: string }) {
  return (
    <div className="mt-4 flex items-center justify-between rounded-2xl border border-dashed border-[var(--primary)]/40 bg-[var(--primary)]/5 p-5">
      <div>
        <p className="font-display text-lg font-semibold text-[var(--primary)]">
          Upgrade to {role.replace("_", " ")} · {cost.toLocaleString()} DOT
        </p>
        <p className="text-sm text-[var(--text-muted)]">{body}</p>
      </div>
      <button className="btn-primary">Upgrade</button>
    </div>
  );
}

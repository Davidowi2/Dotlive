import { useQuery } from "@tanstack/react-query";
import { Wallet as WalletIcon } from "lucide-react";
import { walletApi } from "../api/wallet.js";
import { AppShell } from "../components/AppShell.js";

export function WalletPage() {
  const balance = useQuery({ queryKey: ["wallet"], queryFn: walletApi.balance });
  const txns = useQuery({ queryKey: ["wallet", "txns"], queryFn: walletApi.transactions });

  return (
    <AppShell>
      <h1 className="font-display text-4xl font-bold">Wallet</h1>

        <div className="glass mt-8 rounded-2xl p-8">
          <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
            <WalletIcon className="size-4 text-[var(--primary)]" /> Current balance
          </div>
          <p className="mt-2 font-display text-5xl font-bold text-[var(--primary)]">
            {balance.data ? balance.data.balance.toLocaleString() : "—"}{" "}
            <span className="text-base text-[var(--text-muted)]">DOT</span>
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            ≈ ₦{balance.data ? (balance.data.balance * 10).toLocaleString() : "—"}
          </p>
        </div>

        <h2 className="mt-12 font-display text-2xl font-bold">Transaction history</h2>
        <div className="mt-4 space-y-2">
          {txns.isLoading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
          {txns.data?.transactions.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">No transactions yet.</p>
          )}
          {txns.data?.transactions.map((t) => (
            <div key={t.id} className="glass flex items-center justify-between rounded-xl px-4 py-3">
              <div>
                <p className="font-medium">{t.type}</p>
                {t.description && <p className="text-xs text-[var(--text-muted)]">{t.description}</p>}
              </div>
              <div className="text-right">
                <p className={`font-display font-bold ${t.amount >= 0 ? "text-[var(--primary)]" : "text-red-400"}`}>
                  {t.amount >= 0 ? "+" : ""}
                  {t.amount.toLocaleString()} DOT
                </p>
                <p className="text-xs text-[var(--text-muted)]">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
    </AppShell>
  );
}

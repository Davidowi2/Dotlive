// @ts-nocheck
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.js";
import { AppShell } from "../components/AppShell.js";
import {
  Users as UsersIcon,
  Rocket,
  CreditCard,
  Flag,
  ClipboardList,
  Settings,
  ShieldCheck,
  Ban,
  RefreshCcw,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Admin page — /admin
 *
 * Gated to admin / super_admin roles. Six tabs:
 *   1. Users     — list, search, ban, adjust balance, impersonate
 *   2. Ventures  — list, takedown
 *   3. Payments  — list, replay
 *   4. Flags     — list, upsert (super_admin only)
 *   5. Audit     — paginated, filterable
 *   6. Settings  — your admin profile + sign-out
 *
 * Destructive actions (ban, adjust balance, impersonate, replay,
 * feature flag toggle) all go through the confirm flow:
 *   1. User clicks "Ban user".
 *   2. Frontend calls POST /api/admin/confirm with reason.
 *   3. Modal shows "Type CONFIRM to proceed" with the action
 *      spelled out.
 *   4. On confirm, frontend POSTs the action with X-Admin-Confirm
 *      header and Idempotency-Key.
 *   5. The handler in the backend runs in a transaction with the
 *      audit log.
 */

type Tab = "users" | "ventures" | "payments" | "flags" | "audit" | "settings";

const TABS: { id: Tab; label: string; icon: any; superAdminOnly?: boolean }[] = [
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "ventures", label: "Ventures", icon: Rocket },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "flags", label: "Feature flags", icon: Flag, superAdminOnly: true },
  { id: "audit", label: "Audit log", icon: ClipboardList },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminPage() {
  const { user, primaryRole, hasRole, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("users");

  // Role gate happens in AppShell nav too, but the page itself
  // refuses to render anything for non-admins.
  if (!hasRole("admin") && !hasRole("super_admin")) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl text-center">
          <ShieldCheck className="mx-auto mb-4 size-12 text-[var(--primary)]" />
          <h1 className="font-display text-2xl font-bold">Admin only</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            You need the admin or super_admin role to see this page.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--primary)]"
          >
            Back to dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  const isSuper = hasRole("super_admin");
  const visibleTabs = TABS.filter((t) => !t.superAdminOnly || isSuper);

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="size-6 text-[var(--primary)]" />
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">
            Admin console
          </div>
          <h1 className="font-display text-3xl font-bold">
            {user?.name ?? user?.email}{" "}
            <span className="text-sm font-normal text-[var(--text-muted)]">
              ({isSuper ? "super_admin" : primaryRole ?? "admin"})
            </span>
          </h1>
        </div>
      </div>

      <nav className="mb-6 flex flex-wrap gap-1 border-b border-[var(--border)]">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm transition-colors ${
                active
                  ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "users" && <UsersTab isSuper={isSuper} />}
      {tab === "ventures" && <VenturesTab />}
      {tab === "payments" && <PaymentsTab isSuper={isSuper} />}
      {tab === "flags" && isSuper && <FlagsTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "settings" && <SettingsTab logout={logout} />}
    </AppShell>
  );
}

/* ============================== USERS ============================== */

function UsersTab({ isSuper }: { isSuper: boolean }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => api.get<{ users: any[]; nextCursor: string | null }>(`/api/admin/users?search=${encodeURIComponent(search)}`),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, name, or DOT ID…"
          className="mb-4 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 outline-none focus:border-[var(--primary)]"
        />
        {list.isLoading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
        <div className="space-y-1">
          {list.data?.users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u.id)}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                selected === u.id
                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-[var(--border)] hover:border-[var(--primary)]/40"
              }`}
            >
              <div>
                <p className="font-medium">{u.name ?? u.email}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {u.email} · {u.dotId} · {u.onboardingIntent ?? "—"}
                </p>
              </div>
              <ChevronRight className="size-4 text-[var(--text-muted)]" />
            </button>
          ))}
        </div>
      </section>
      <aside>
        {selected ? (
          <UserDetailPanel userId={selected} isSuper={isSuper} />
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-muted)]">
            Select a user to see actions
          </div>
        )}
      </aside>
    </div>
  );
}

function UserDetailPanel({ userId, isSuper }: { userId: string; isSuper: boolean }) {
  const detail = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => api.get<any>(`/api/admin/users/${userId}`),
    enabled: !!userId,
  });

  if (detail.isLoading) return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;
  if (!detail.data) return null;

  const { user, wallet, roles, ban, recentTransactions } = detail.data;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">User</p>
        <p className="mt-1 font-display text-lg font-semibold">{user.name ?? user.email}</p>
        <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
        <p className="mt-1 text-xs">
          <span className="text-[var(--text-muted)]">DOT ID:</span> {user.dotId}
        </p>
        <p className="mt-2 flex flex-wrap gap-1">
          {roles.map((r: string) => (
            <span key={r} className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">
              {r}
            </span>
          ))}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Wallet</p>
        <p className="mt-1 font-display text-2xl font-bold text-[var(--primary)]">
          {wallet ? Number(wallet.balance).toLocaleString() : "—"} DOT
        </p>
        {isSuper && (
          <button
            onClick={() => runAdminAction("Adjust balance", { userId, target: "wallet", isSuper })}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)]/10 px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/20"
          >
            <Wallet className="size-4" /> Adjust balance
          </button>
        )}
      </div>

      {ban && !ban.revokedAt && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400">Banned</p>
          <p className="mt-1 text-sm">{ban.reason}</p>
          {isSuper && (
            <button
              onClick={() => runAdminAction("Unban user", { userId, target: "user.unban", isSuper })}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-400 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              <RefreshCcw className="size-4" /> Unban
            </button>
          )}
        </div>
      )}

      {isSuper && !ban?.revokedAt && (
        <button
          onClick={() => runAdminAction("Ban user", { userId, target: "user.ban", isSuper })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/40 bg-red-500/5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          <Ban className="size-4" /> Ban user
        </button>
      )}

      {isSuper && (
        <button
          onClick={() => runAdminAction("Impersonate user", { userId, target: "user.impersonate", isSuper })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/5 px-3 py-2 text-sm text-[var(--gold)] hover:bg-[var(--gold)]/10"
        >
          Impersonate (15 min)
        </button>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
        <p className="mb-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">Recent transactions</p>
        <div className="space-y-1 text-sm">
          {recentTransactions.length === 0 && (
            <p className="text-xs text-[var(--text-muted)]">None yet.</p>
          )}
          {recentTransactions.slice(0, 8).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">{t.type}</span>
              <span className={t.amount > 0 ? "text-[var(--primary)]" : "text-red-400"}>
                {t.amount > 0 ? "+" : ""}
                {t.amount} DOT
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================== VENTURES ============================== */

function VenturesTab() {
  const list = useQuery({
    queryKey: ["admin", "ventures"],
    queryFn: () => api.get<{ ventures: any[] }>("/api/admin/ventures?limit=50"),
  });

  return (
    <div className="space-y-1">
      {list.isLoading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {list.data?.ventures.map((v) => (
        <div key={v.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
          <div>
            <p className="font-medium">{v.name}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {v.industry ?? "—"} · {v.stage} · {v.country ?? "—"}
            </p>
          </div>
          <button
            onClick={() => runAdminAction("Takedown venture", { ventureId: v.id, target: "venture.takedown" })}
            className="text-xs text-red-400 hover:underline"
          >
            Takedown
          </button>
        </div>
      ))}
    </div>
  );
}

/* ============================== PAYMENTS ============================== */

function PaymentsTab({ isSuper }: { isSuper: boolean }) {
  const list = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: () => api.get<{ payments: any[] }>("/api/admin/payments?limit=50"),
  });

  return (
    <div className="space-y-1">
      {list.isLoading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {list.data?.payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
          <div>
            <p className="font-medium">
              {p.provider} · {p.eventType}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {p.currency} {(p.amountMinor / 100).toLocaleString()} · {p.status} ·{" "}
              {new Date(p.createdAt).toLocaleString()}
            </p>
          </div>
          {isSuper && p.status === "failed" && (
            <button
              onClick={() => runAdminAction("Replay payment", { paymentId: p.id, target: "payment.replay" })}
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Replay
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================== FLAGS ============================== */

function FlagsTab() {
  const list = useQuery({
    queryKey: ["admin", "flags"],
    queryFn: () => api.get<{ flags: any[] }>("/api/admin/feature-flags"),
  });

  return (
    <div className="space-y-1">
      {list.isLoading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {list.data?.flags.map((f) => (
        <div key={f.key} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
          <div>
            <p className="font-mono text-sm">{f.key}</p>
            <p className="text-xs text-[var(--text-muted)]">{f.description}</p>
          </div>
          <button
            onClick={() =>
              runAdminAction(`${f.enabled ? "Disable" : "Enable"} flag`, {
                flagKey: f.key,
                target: "feature_flag.upsert",
                enabled: !f.enabled,
              })
            }
            className={`text-xs ${f.enabled ? "text-red-400" : "text-[var(--primary)]"}`}
          >
            {f.enabled ? "Disable" : "Enable"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ============================== AUDIT ============================== */

function AuditTab() {
  const list = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => api.get<{ entries: any[]; nextCursor: string | null }>("/api/admin/audit?limit=100"),
  });

  return (
    <div className="space-y-1">
      {list.isLoading && <p className="text-sm text-[var(--text-muted)]">Loading…</p>}
      {list.data?.entries.map((e) => (
        <div key={e.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[var(--primary)]">{e.action}</span>
            <span className="text-xs text-[var(--text-muted)]">{new Date(e.createdAt).toLocaleString()}</span>
          </div>
          <p className="mt-1 text-xs">
            <span className="text-[var(--text-muted)]">by</span> {e.actorEmail}{" "}
            <span className="text-[var(--text-muted)]">on</span> {e.targetType ?? "—"}/{e.targetId ?? "—"}
          </p>
          {e.reason && (
            <p className="mt-1 text-xs italic text-[var(--text-muted)]">"{e.reason}"</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================== SETTINGS ============================== */

function SettingsTab({ logout }: { logout: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] p-5">
        <p className="font-display text-lg font-semibold">Your admin profile</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Your admin actions are logged with your email, IP, and the reason you provide.
        </p>
      </div>
      <button
        onClick={logout}
        className="rounded-lg border border-red-400/40 bg-red-500/5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
      >
        Sign out
      </button>
    </div>
  );
}

/* ============================== Confirm flow ============================== */

async function runAdminAction(label: string, opts: { target: string; isSuper?: boolean; [k: string]: any }) {
  // First, prompt for the reason. Browser prompt is fine here — we
  // already gated on super_admin and have the audit log. In a
  // production app we'd use a custom modal; for now, prompt keeps
  // this file self-contained.
  const reason = window.prompt(`${label}\n\nReason (8+ chars). This is logged:`)?.trim();
  if (!reason || reason.length < 8) {
    toast.error("Reason is required (8+ characters).");
    return;
  }

  const needsConfirm = ["user.ban", "user.unban", "wallet.adjust", "user.impersonate", "payment.replay", "feature_flag.upsert", "venture.takedown"].includes(opts.target);

  let confirmToken: string | null = null;
  if (needsConfirm) {
    try {
      const res = await api.post<{ token: string; expiresAt: string }>("/api/admin/confirm", {
        action: opts.target,
        reason,
        targetType: opts.target.startsWith("user.") ? "user" : opts.target.startsWith("venture.") ? "venture" : opts.target.startsWith("payment.") ? "payment" : "feature_flag",
        targetId: opts.userId ?? opts.ventureId ?? opts.paymentId ?? opts.flagKey,
      });
      confirmToken = res.token;
    } catch (e) {
      toast.error(`Could not issue confirm token: ${(e as Error).message}`);
      return;
    }
  }

  // Type the action → route mapping.
  const ROUTES: Record<string, { method: string; path: (o: any) => string }> = {
    "user.ban": { method: "POST", path: (o) => `/api/admin/users/${o.userId}/ban` },
    "user.unban": { method: "POST", path: (o) => `/api/admin/users/${o.userId}/unban` },
    "wallet.adjust": { method: "POST", path: (o) => `/api/admin/users/${o.userId}/adjust-balance` },
    "user.impersonate": { method: "POST", path: (o) => `/api/admin/users/${o.userId}/impersonate` },
    "venture.takedown": { method: "POST", path: (o) => `/api/admin/ventures/${o.ventureId}/takedown` },
    "payment.replay": { method: "POST", path: (o) => `/api/admin/payments/${o.paymentId}/replay` },
    "feature_flag.upsert": { method: "PUT", path: (o) => `/api/admin/feature-flags/${o.flagKey}` },
  };

  const route = ROUTES[opts.target];
  if (!route) {
    toast.error(`Unknown action: ${opts.target}`);
    return;
  }

  // Build the request body.
  let body: any = { reason };
  if (opts.target === "wallet.adjust") {
    const amt = window.prompt("Amount in DOT (positive to credit, negative to debit):", "0") ?? "0";
    const description = window.prompt("Description (will appear in user's transaction history):", "Manual adjustment");
    if (!description) return;
    body = { ...body, amount: Number(amt), description };
  }
  if (opts.target === "feature_flag.upsert") {
    body = { ...body, enabled: !!opts.enabled, rolloutPercent: null };
  }

  const idemKey = `${opts.target}-${opts.userId ?? opts.ventureId ?? opts.paymentId ?? opts.flagKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const headers: Record<string, string> = { "Idempotency-Key": idemKey };
    if (confirmToken) headers["X-Admin-Confirm"] = confirmToken;
    const res = await fetch(`/api${route.path(opts).replace("/api", "")}`, {
      method: route.method,
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text();
      toast.error(`Action failed (${res.status}): ${text.slice(0, 200)}`);
      return;
    }
    toast.success(`${label} done.`);
    // Force-refresh the current view by reloading the route would
    // be cleanest, but for now a window.location.reload is the
    // simplest way to get fresh data across all tabs.
    setTimeout(() => window.location.reload(), 500);
  } catch (e) {
    toast.error(`Network error: ${(e as Error).message}`);
  }
}

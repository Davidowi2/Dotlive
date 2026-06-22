// @ts-nocheck
import { type ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Wallet, Hammer, BarChart3, LogOut, Settings, Home } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.js";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  /** Show only if user has this role (or always show if undefined). */
  requires?: "founder" | "investor" | "community_leader" | "builder";
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: Home },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/work", label: "DOT Work", icon: Hammer },
  { to: "/vantage", label: "Vantage", icon: BarChart3, requires: "builder" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, primaryRole, hasRole, logout } = useAuth();
  const loc = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  const items = NAV.filter((n) => !n.requires || hasRole(n.requires as any));

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-soft)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              className="rounded p-1.5 hover:bg-[var(--border)] lg:hidden"
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <span className="block size-5">☰</span>
            </button>
            <Link to="/dashboard" className="font-display text-lg font-bold">
              <img src="/logo.svg" alt="DOT" className="inline size-5 align-text-bottom opacity-80" /> dotlive
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--text-muted)] sm:inline">
              {user?.name ?? user?.email}
            </span>
            <span className="hidden rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-xs capitalize text-[var(--text-muted)] sm:inline">
              {primaryRole ?? "builder"}
            </span>
            <button
              onClick={logout}
              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--border)] hover:text-[var(--text)]"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Side nav (collapsible on mobile) */}
        <aside
          className={`${navOpen ? "block" : "hidden"} w-48 shrink-0 lg:block`}
        >
          <nav className="space-y-1">
            {items.map((n) => {
              const Icon = n.icon;
              const active = loc.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                  }`}
                >
                  <Icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

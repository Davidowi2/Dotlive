/**
 * Admin layout — wraps all /admin/* routes with:
 *   - User AppShell (workspace sidebar)
 *   - Admin sidebar (dashboard, members, wallets, tokens, roles, content)
 *
 * Routes:
 *   /admin              → index dashboard (stats, alerts, recent ops)
 *   /admin/members      → All profiles (everyone in the DB, with search/filter)
 *   /admin/wallets      → Wallet overview + admin transfer
 *   /admin/tokens       → Token supply + cap visualization
 *   /admin/roles        → Roles hierarchy + audit log
 *
 * This is the new "admin has their own dashboard" — replaces the tabbed admin.tsx.
 */

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Activity,
  Users,
  Wallet as WalletIcon,
  Coins,
  ShieldAlert,
  BookOpen,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

import { useDotAuth } from "@/contexts/DotAuthContext";
import { AppShell } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route: any = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin — DOT" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { roles } = useDotAuth();
  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = roles.includes("admin") || isSuperAdmin;

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl py-20 text-center">
          <ShieldAlert className="mx-auto size-12 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">Admin only</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an admin account to access the admin dashboard.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth" search={{ mode: "signin" }}>Sign in</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const nav = [
    { label: "Dashboard", to: "/admin", icon: Activity, exact: true },
    { label: "Members", to: "/admin/members", icon: Users },
    { label: "Wallets", to: "/admin/wallets", icon: WalletIcon },
    { label: "Tokens", to: "/admin/tokens", icon: Coins },
    ...(isSuperAdmin ? [{ label: "Roles", to: "/admin/roles", icon: ShieldAlert }] : []),
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Back to app + breadcrumb */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to app
          </Link>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {isSuperAdmin ? "Super Admin" : "Admin"}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          {/* Admin sidebar */}
          <aside className="space-y-1">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card p-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin console</div>
                <h2 className="font-display text-sm">
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </h2>
              </div>
            </div>
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={item.exact ? { exact: true } : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  "text-muted-foreground hover:bg-muted hover:text-foreground",
                  "[&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-medium",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </aside>

          {/* Content area */}
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </AppShell>
  );
}
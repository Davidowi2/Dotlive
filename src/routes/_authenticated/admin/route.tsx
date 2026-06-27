/**
 * Admin layout — full-page experience.
 *
 * Wraps all /admin/* routes with:
 *   - AdminShell (NOT the workspace AppShell)
 *   - Admin sidebar with all admin pages
 *   - "Back to app" button in the top header to return to /dashboard
 *
 * Routes:
 *   /admin              → dashboard
 *   /admin/members      → all users
 *   /admin/wallets      → wallet overview + admin transfer
 *   /admin/tokens       → token supply + cap visualization
 *   /admin/permissions  → role + permission matrix
 *   /admin/roles        → super-admin only
 */

import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Activity,
  Users,
  Wallet as WalletIcon,
  Coins,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { useDotAuth } from "@/contexts/DotAuthContext";
import { AdminShell, AdminSidebar } from "@/components/app/AdminShell";
import { Button } from "@/components/ui/button";

export const Route: any = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — DOT" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { roles } = useDotAuth();
  const location = useLocation();
  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = roles.includes("admin") || isSuperAdmin;

  if (!isAdmin) {
    return (
      <AdminShell role="Access denied">
        <div className="mx-auto max-w-xl py-20 text-center">
          <ShieldAlert className="mx-auto size-12 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">Admin only</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an admin account to access the admin dashboard.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth" search={{ mode: "signin" }}>
              Sign in
            </Link>
          </Button>
        </div>
      </AdminShell>
    );
  }

  const nav = [
    { label: "Dashboard", to: "/admin", icon: Activity, exact: true },
    { label: "Members", to: "/admin/members", icon: Users },
    { label: "Wallets", to: "/admin/wallets", icon: WalletIcon },
    { label: "Tokens", to: "/admin/tokens", icon: Coins },
    { label: "Permissions", to: "/admin/permissions", icon: ShieldCheck },
    ...(isSuperAdmin
      ? [{ label: "Roles", to: "/admin/roles", icon: ShieldAlert }]
      : []),
  ];

  return (
    <AdminShell role={isSuperAdmin ? "Super Admin" : "Admin"}>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[200px_1fr] xl:grid-cols-[220px_1fr]">
        {/* Admin sidebar (desktop only — mobile users use the bottom of the
            topbar's "Back to app" button or browser back) */}
        <aside className="hidden lg:block">
          <AdminSidebar items={nav} currentPath={location.pathname} />
        </aside>

        {/* Mobile: horizontal scrollable nav */}
        <div className="overflow-x-auto lg:hidden">
          <div className="flex gap-2 pb-2">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <Outlet />
        </div>
      </div>
    </AdminShell>
  );
}
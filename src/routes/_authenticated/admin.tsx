/**
 * /admin — Layout with sidebar navigation.
 * All /admin/* routes use this shared chrome.
 */

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Activity, Users, Wallet as WalletIcon, Coins, ShieldAlert, BookOpen, Loader2, ShieldCheck } from "lucide-react";

import { useDotAuth } from "@/contexts/DotAuthContext";
import { AppShell } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
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
            <Link to="/auth">Sign in</Link>
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
    { label: "Content", to: "/admin/content", icon: BookOpen },
  ];

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-1">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Admin console</div>
              <h2 className="font-display text-lg">
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
    </AppShell>
  );
}

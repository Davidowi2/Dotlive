import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Gauge,
  Wallet,
  BookOpen,
  CalendarCheck,
  Trophy,
  Building2,
  Users,
  Briefcase,
  Hammer,
  Shield,
  LogOut,
  Loader2,
  Search,
  Bell,
  Award,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type AppRole } from "@/lib/constants";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  roles?: AppRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",      to: "/dashboard",    icon: LayoutDashboard },
  { label: "Discover",       to: "/discover",     icon: Search },
  { label: "Vantage",        to: "/vantage",      icon: Gauge,       roles: ["founder"] },
  { label: "Wallet",         to: "/wallet",       icon: Wallet },
  { label: "DOT Work",       to: "/work",         icon: Hammer },
  { label: "Academy",        to: "/academy",      icon: BookOpen,    roles: ["founder"] },
  { label: "Sessions",       to: "/sessions",     icon: CalendarCheck },
  { label: "Pitchathons",    to: "/pitchathons",  icon: Trophy,      roles: ["founder"] },
  { label: "DOT Demo",       to: "/demo",         icon: Building2 },
  { label: "Community",      to: "/community",    icon: Users,       roles: ["community_leader"] },
  { label: "Investor Portal",to: "/investor",     icon: Briefcase,   roles: ["investor"] },
  { label: "Judge Portal",   to: "/judge",        icon: Trophy,      roles: ["investor", "admin"] },
  { label: "Meetings",       to: "/meetings",     icon: Bell,        roles: ["investor", "founder"] },
  { label: "Certificates",   to: "/certificates", icon: Award,       roles: ["founder"] },
  { label: "Notifications",  to: "/notifications",icon: Bell },
  { label: "Settings",       to: "/settings",     icon: Settings },
  { label: "Admin",          to: "/admin",        icon: Shield,      roles: ["admin"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, primaryRole, isLoading, logout } = useDotAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isLoading && user && roles.length === 0) {
      navigate({ to: "/onboarding" });
    }
  }, [isLoading, user, roles, navigate]);

  function handleSignOut() {
    logout();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = NAV_ITEMS.filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)));
  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {primaryRole && (
              <span className="hidden text-[10px] tracking-widest uppercase text-muted-foreground sm:inline">
                {ROLE_LABELS[primaryRole as AppRole] ?? primaryRole}
              </span>
            )}
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {initial}
            </span>
            <button
              onClick={handleSignOut}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar — editorial, hairline border */}
        <aside className="hidden w-48 shrink-0 border-r border-border pr-6 lg:block">
          <nav className="sticky top-20 space-y-0">
            {items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 py-2 text-sm transition-colors",
                    active
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground font-normal",
                  )}
                >
                  <item.icon className={cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground/50")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 lg:pl-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="sticky bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/95 px-2 py-1 backdrop-blur-xl lg:hidden">
        {items.slice(0, 5).map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] transition-colors",
                active ? "text-primary font-medium" : "text-muted-foreground",
              )}
            >
              <item.icon className={cn("size-5", active && "text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

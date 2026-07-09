import { useEffect, useState, type ReactNode } from "react";
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
  Compass,
  Briefcase,
  Hammer,
  Shield,
  LogOut,
  Loader2,
  Search,
  Filter,
  Bell,
  Award,
  Settings,
  Lock,
  Menu as MenuIcon,
  X,
  BarChart3,
  HelpCircle,
  LineChart,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { NotificationBell } from "@/components/app/NotificationBell";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type AppRole } from "@/lib/constants";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles?: AppRole[];
  /** Logical section for sidebar grouping */
  section?: "main" | "growth" | "community" | "capital" | "admin";
}

/* Section order is fixed; sections without items get hidden automatically. */
const NAV_ITEMS: NavItem[] = [
  /* main */
  { label: "Dashboard",     to: "/dashboard",     icon: LayoutDashboard, section: "main" },
    { label: "Discover",      to: "/discover",      icon: Search,          section: "main" },
    { label: "Search",        to: "/search",        icon: Filter,          section: "main" },
  { label: "Meetings",      to: "/meetings",      icon: MessageSquare,   section: "main" },
  { label: "Notifications", to: "/notifications", icon: Bell,            section: "main" },
  /* growth — founder progression */
  { label: "Vantage",       to: "/vantage",       icon: Gauge,       roles: ["founder"],                 section: "growth" },
  { label: "Wallet",        to: "/wallet",           icon: Wallet,                                     section: "growth" },
  { label: "Stakes",        to: "/stakes",        icon: Lock,                                       section: "growth" },
  { label: "Refer & Earn",  to: "/referrals",        icon: Users,                                      section: "growth" },
  { label: "Leaderboard",   to: "/leaderboard",    icon: Trophy,                                     section: "growth" },
  { label: "Builder Arena", to: "/builder",       icon: Trophy,      roles: ["builder"],                 section: "growth" },
  { label: "DOT Work",      to: "/work",          icon: Hammer,                                     section: "growth" },
  { label: "Academy",       to: "/academy",       icon: BookOpen,                                      section: "growth" },
  { label: "Sessions",      to: "/sessions",      icon: CalendarCheck,                              section: "growth" },
  { label: "Pitchathons",   to: "/pitchathons",   icon: Trophy,      roles: ["founder"],                 section: "growth" },
  { label: "Certificates",  to: "/certificates",  icon: Award,       roles: ["founder"],                 section: "growth" },
  /* community */
    { label: "My Community",  to: "/community",           icon: Users,   roles: ["community_leader", "admin", "super_admin"], section: "community" },
  /* capital */
  { label: "DOT Demo",      to: "/demo",          icon: Building2,                                  section: "capital" },
  { label: "My Venture",    to: "/ventures",      icon: LineChart,    roles: ["founder"],                 section: "capital" },
  { label: "Investor Portal", to: "/investor",    icon: Briefcase,   roles: ["investor"],                section: "capital" },
  { label: "My Portfolio",   to: "/portfolio",    icon: LineChart,    roles: ["investor"],                section: "capital" },
  { label: "Capital Partner", to: "/capital",     icon: Wallet,      roles: ["capital_partner"],         section: "capital" },
  { label: "Judge Portal",  to: "/judge",         icon: Trophy,      roles: ["judge"],                    section: "capital" },
  /* operator (formerly "admin" — internal staff, not a self-assignable role) */
  { label: "Operator",      to: "/admin",         icon: Shield,      roles: ["admin", "super_admin"],    section: "admin" },
  /* always */
  { label: "Settings",      to: "/settings",      icon: Settings,                                   section: "main" },
  { label: "Help",          to: "/help",          icon: HelpCircle,                                section: "main" },
];

const SECTION_META: Record<string, { label: string }> = {
  main:      { label: "Workspace" },
  growth:    { label: "Growth" },
  community: { label: "Community" },
  capital:   { label: "Capital" },
  admin:     { label: "Operator" },
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, primaryRole, isLoading, logout } = useDotAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && user && roles.length === 0) {
      navigate({ to: "/onboarding" });
    }
  }, [isLoading, user, roles, navigate]);

  // Close mobile sheet on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function handleSignOut() {
    logout();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
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

  /* Group items by section, drop empty sections */
  const sections = (Object.keys(SECTION_META) as Array<keyof typeof SECTION_META>)
    .map((key) => ({
      key,
      label: SECTION_META[key].label,
      items: items.filter((i) => (i.section ?? "main") === key),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <ThemeToggle />
            {primaryRole && (
              <span className="hidden text-[10px] tracking-widest uppercase font-semibold text-primary sm:inline-flex sm:items-center sm:gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" />
                {ROLE_LABELS[primaryRole as AppRole] ?? primaryRole}
              </span>
            )}
            <Link
              to="/settings"
              aria-label="Account"
              className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {initial}
            </Link>
            <button
              onClick={handleSignOut}
              className="hidden sm:flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar — sectioned, with active indicator */}
        <aside className="hidden w-56 shrink-0 border-r border-border pr-6 lg:block">
          <nav className="sticky top-20 space-y-6 overflow-y-auto max-h-[calc(100vh-6rem)]">
            {sections.map((section) => (
              <div key={section.key}>
                <div className="mb-2 px-2">
                  <span className="text-[10px] tracking-widest uppercase font-semibold text-muted-foreground/70">
                    {section.label}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    // Exact match OR starts-with ONLY for non-ambiguous routes.
                    // Exclude cases where a SIBLING nav item is more specific
                    // (e.g. /discover should NOT highlight for /discover/communities).
                    const siblingPaths = section.items
                      .filter((s) => s.to !== item.to && s.to.startsWith(item.to + "/"))
                      .map((s) => s.to);
                    const active =
                      pathname === item.to ||
                      (pathname.startsWith(item.to + "/") &&
                        !siblingPaths.some((s) => pathname === s || pathname.startsWith(s + "/")));
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={cn(
                            "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                            active
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {/* Active left bar */}
                          <span
                            className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary transition-opacity",
                              active ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <item.icon
                            className={cn(
                              "size-4 shrink-0 transition-colors",
                              active ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground",
                            )}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 lg:pl-8">{children}</main>
      </div>

      {/* Mobile bottom nav — 5 most-used + "More" sheet for the rest */}
      <nav className="sticky bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/95 px-2 py-1 backdrop-blur-xl lg:hidden">
        {items.slice(0, 4).map((item) => {
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
        {/* "More" button — opens a sheet with all remaining nav items */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] text-muted-foreground transition-colors active:text-foreground"
          aria-label="More navigation"
        >
          <MenuIcon className="size-5" />
          More
        </button>
      </nav>

      {/* Mobile "More" sheet — slide-up from bottom */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background shadow-2xl animate-in slide-in-from-bottom">
            {/* Drag handle */}
            <div className="sticky top-0 z-10 flex justify-center bg-background pt-2 pb-1">
              <span className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg">All sections</h2>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
              {sections.map((section) => (
                <div key={section.key} className="mb-5">
                  <div className="mb-2 px-2">
                    <span className="text-[10px] tracking-widest uppercase font-semibold text-muted-foreground/70">
                      {section.label}
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = pathname === item.to;
                      return (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                              active
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-foreground hover:bg-muted",
                            )}
                          >
                            <item.icon className="size-4 shrink-0" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
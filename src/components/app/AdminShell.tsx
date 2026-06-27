/**
 * AdminShell — Full-page admin experience.
 *
 * Replaces AppShell on /admin/* routes. Has its own header (with
 * "Back to app" button instead of the workspace nav) and its own
 * sidebar listing only admin pages. No workspace sidebar, no mobile
 * bottom nav — admin is desktop-focused.
 */

import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LogOut, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/site/Logo";
import { cn } from "@/lib/utils";
import { useDotAuth } from "@/contexts/DotAuthContext";

export function AdminShell({
  children,
  sidebar,
  role = "Admin",
}: {
  children: React.ReactNode;
  /** Optional sidebar to render to the right of the topbar (default: empty) */
  sidebar?: React.ReactNode;
  /** Role label (defaults to "Admin") */
  role?: string;
}) {
  const navigate = useNavigate();
  const { signOut } = useDotAuth();
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Left: logo + back to app */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center" aria-label="DOT home">
              <Logo />
            </Link>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard" })}
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              aria-label="Back to main app"
            >
              <ArrowLeft className="size-3.5" />
              Back to app
            </button>
          </div>

          {/* Right: role badge + theme + account + signout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              {role}
            </span>
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate({ to: "/auth", search: { mode: "signin" } });
              }}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        {/* Mobile-only back-to-app row */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-2 sm:hidden">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to main app
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6 sm:px-6">
        {/* Admin sidebar (desktop) */}
        {sidebar && (
          <aside className="hidden w-56 shrink-0 lg:block">{sidebar}</aside>
        )}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

/**
 * AdminSidebar — The internal sidebar used inside AdminShell.
 * Takes a list of nav items.
 */
export function AdminSidebar({
  items,
  currentPath,
}: {
  items: Array<{ to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }>;
  currentPath: string;
}) {
  return (
    <nav className="sticky top-20 space-y-0.5">
      {items.map((item) => {
        const active = item.exact
          ? currentPath === item.to
          : currentPath === item.to || currentPath.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
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
        );
      })}
    </nav>
  );
}
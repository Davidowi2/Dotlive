import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, User, LayoutDashboard, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Platform", to: "/platform" },
  { label: "Journey", to: "/journey" },
  { label: "Communities", to: "/communities" },
  { label: "Investors", to: "/investors" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isLoading, logout } = useDotAuth();
  const authed = !isLoading && !!user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-xs tracking-widest uppercase font-medium text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
                  <ThemeToggle />
                  {authed ? (
                    <>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/dashboard" className="text-xs tracking-widest uppercase">
                          <LayoutDashboard className="mr-1.5 size-3.5" />
                          Dashboard
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        <Link to={`/profile`} className="text-xs tracking-widest uppercase">
                          <User className="mr-1.5 size-3.5" />
                          {user?.name?.split(" ")[0] ?? "Profile"}
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/auth" search={{ mode: "signin" }} className="text-xs tracking-widest uppercase">Sign in</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                        <Link to="/auth" search={{ mode: "signup" }} className="text-xs tracking-widest uppercase">Get started</Link>
                      </Button>
                    </>
                  )}
                </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/60 md:hidden",
          open ? "max-h-96" : "max-h-0",
          "transition-all duration-300",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-xs tracking-widest uppercase font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
                      {authed ? (
                        <>
                          <Button variant="outline" asChild>
                            <Link to="/dashboard" onClick={() => setOpen(false)}>
                              <LayoutDashboard className="mr-2 size-4" /> Dashboard
                            </Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link to="/profile" onClick={() => setOpen(false)}>
                              <User className="mr-2 size-4" /> {user?.name?.split(" ")[0] ?? "Profile"}
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              logout();
                              setOpen(false);
                            }}
                            type="button"
                          >
                            <LogOut className="mr-2 size-4" /> Sign out
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" asChild>
                            <Link to="/auth" search={{ mode: "signin" }} onClick={() => setOpen(false)}>
                              Sign in
                            </Link>
                          </Button>
                          <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                            <Link to="/auth" search={{ mode: "signup" }} onClick={() => setOpen(false)}>
                              Get started
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
        </nav>
      </div>
    </header>
  );
}

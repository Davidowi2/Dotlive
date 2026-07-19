/**
 * /onboarding/builder — legacy redirect.
 *
 * Builder profile setup is now integrated into the main onboarding flow at /onboarding.
 * This route redirects to /onboarding for new users.
 */

import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const Route = createFileRoute("/_authenticated/onboarding/builder")({
  head: () => ({ meta: [{ title: "Builder Profile Setup — DOT" }] }),
  component: BuilderRedirect,
});

function BuilderRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/onboarding" });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border/60 bg-background/80">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          <ThemeToggle />
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <p className="text-center text-muted-foreground">Redirecting to onboarding...</p>
      </div>
    </div>
  );
}

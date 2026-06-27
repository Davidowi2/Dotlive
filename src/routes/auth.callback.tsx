/**
 * /auth/callback — handles the redirect from the Fastify backend
 * after Google OAuth completes.
 *
 * The backend redirects to:
 *   /auth/callback?token=<jwt>[&isNew=true]
 *
 * This page:
 *   1. Reads ?token (and ?isNew) from the URL
 *   2. Stores the token via setToken()
 *   3. Calls getMe() to confirm it works
 *   4. Sends new users to /onboarding, existing users to /dashboard
 *   5. On any error, redirects to /auth with a toast
 */

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { setToken } from "@/api/client";
import { getMe } from "@/api/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing in — DOT" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handle() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const errorParam = params.get("error");
      const isNewParam = params.get("isNew") === "true";

      if (errorParam) {
        const msg = decodeURIComponent(errorParam);
        setError(msg);
        toast.error(msg);
        setTimeout(() => navigate({ to: "/auth", search: { mode: "signin" } }), 2500);
        return;
      }

      if (!token) {
        const msg = "No authentication token received.";
        setError(msg);
        toast.error(msg);
        setTimeout(() => navigate({ to: "/auth", search: { mode: "signin" } }), 2500);
        return;
      }

      try {
        setToken(token);
        const user = await getMe();

        if (!user) {
          throw new Error("Could not load user profile.");
        }

        // New users go through onboarding. Heuristic:
        //   - Explicit ?isNew=true flag (set by Google OAuth callback) → new
        //   - onboardedAt is null/undefined → new
        //   - Only has the default 'builder' role → new
        //   - account created <5min ago → new
        const ageMs = Date.now() - new Date(user.createdAt ?? Date.now()).getTime();
        const isNewUser =
          isNewParam ||
          !user.onboardedAt ||
          user.roles.length === 1 ||
          ageMs < 5 * 60 * 1000;

        toast.success(`Welcome${user.name ? `, ${user.name.split(" ")[0]}` : ""}!`);
        navigate({ to: isNewUser ? "/onboarding" : "/dashboard" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign-in failed.";
        setError(msg);
        toast.error(msg);
        setTimeout(() => navigate({ to: "/auth", search: { mode: "signin" } }), 2500);
      }
    }

    handle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <p className="font-medium text-destructive">{error}</p>
        <p className="text-sm text-muted-foreground">Redirecting you back to sign in…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
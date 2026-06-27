/**
 * /auth-callback — handles multiple redirect flows into the app:
 *
 *   1. Google OAuth →  ?token=<jwt>[&isNew=true]
 *   2. Magic link   →  ?verify=<token>
 *   3. Reset link   →  ?reset=<token>
 *
 * For OAuth: stores token, calls getMe, routes to /onboarding or /dashboard.
 * For magic link: calls /api/auth/verify-magic-link with the token, gets
 *   back a signupToken (if signup) or a JWT (if signin), then routes accordingly.
 *
 * NOTE: Filename uses `-` (not `.`) so TanStack Router treats this
 * as a flat sibling route — not a child of `/auth`. Otherwise the
 * AuthPage (SigninForm/SignupFlow) wraps the callback and renders
 * the wrong page.
 */

import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { setToken, dotApi } from "@/api/client";
import { getMe } from "@/api/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth-callback")({
  head: () => ({ meta: [{ title: "Signing in — DOT" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Completing sign in…");

  useEffect(() => {
    async function handle() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const verifyToken = params.get("verify");
      const errorParam = params.get("error");
      const isNewParam = params.get("isNew") === "true";

      // ── Magic-link verification flow ──
      if (verifyToken) {
        try {
          setMessage("Verifying your email link…");
          const res = await dotApi.post<{
            ok: boolean;
            signupToken?: string;
            email?: string;
            token?: string;
            user?: any;
            verified?: boolean;
          }>("/api/auth/verify-magic-link", { token: verifyToken });

          // For signup: forward the signupToken to /auth?mode=signup-link so the
          // user can complete signup by choosing a password.
          if (res.signupToken && res.email) {
            setStatus("success");
            setMessage("Email verified! Loading signup…");
            toast.success("Email verified! Finish setting up your account.");
            // Clean URL
            window.history.replaceState({}, "", window.location.pathname);
                        // Forward the signupToken to the auth page so user can choose a password.
                        // Encode in sessionStorage so it doesn't show in URL history.
                        sessionStorage.setItem("dot_magic_signup", JSON.stringify({ signupToken: res.signupToken, email: res.email }));
                        navigate({
                          to: "/auth",
                          search: { mode: "signup" },
                        });
                        return;
                      }

          // For signin: token + user returned directly → save + go to dashboard
          if (res.token && res.user) {
            setToken(res.token);
            setStatus("success");
            setMessage(`Welcome back, ${res.user.name?.split(" ")[0] ?? "founder"}!`);
            toast.success("Signed in!");
            const ageMs = Date.now() - new Date(res.user.createdAt ?? Date.now()).getTime();
            const isNewUser =
              !res.user.onboardedAt ||
              res.user.roles.length === 1 ||
              ageMs < 5 * 60 * 1000;
            window.history.replaceState({}, "", window.location.pathname);
            navigate({ to: isNewUser ? "/onboarding" : "/dashboard" });
            return;
          }

          if (res.verified) {
            setStatus("success");
            setMessage("Email verified!");
            toast.success("Your email is verified.");
            window.history.replaceState({}, "", window.location.pathname);
            navigate({ to: "/dashboard" });
            return;
          }

          throw new Error("Unexpected response from verification.");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Verification failed";
          setStatus("error");
          setMessage(msg);
          toast.error(msg);
          setTimeout(() => navigate({ to: "/auth", search: { mode: "signin" } }), 3500);
          return;
        }
      }

      // ── OAuth flow (Google) ──
      if (errorParam) {
        const msg = decodeURIComponent(errorParam);
        setStatus("error");
        setMessage(msg);
        toast.error(msg);
        setTimeout(() => navigate({ to: "/auth", search: { mode: "signin" } }), 2500);
        return;
      }

      if (!token) {
        const msg = "No authentication token received.";
        setStatus("error");
        setMessage(msg);
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

        const ageMs = Date.now() - new Date(user.createdAt ?? Date.now()).getTime();
        const isNewUser =
          isNewParam ||
          !user.onboardedAt ||
          user.roles.length === 1 ||
          ageMs < 5 * 60 * 1000;

        setStatus("success");
                setMessage(`Welcome${user.name ? `, ${user.name.split(" ")[0]}` : ""}!`);
                toast.success(message);
                window.history.replaceState({}, "", window.location.pathname);
                navigate({ to: isNewUser ? "/onboarding" : "/dashboard" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign-in failed.";
        setStatus("error");
        setMessage(msg);
        toast.error(msg);
        setTimeout(() => navigate({ to: "/auth", search: { mode: "signin" } }), 2500);
      }
    }

    handle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      {status === "verifying" && (
        <>
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <p className="font-medium">{message}</p>
          <p className="text-xs text-muted-foreground">Redirecting…</p>
        </>
      )}
      {status === "error" && (
        <>
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            ✕
          </div>
          <p className="font-medium text-destructive">{message}</p>
          <p className="text-xs text-muted-foreground">Redirecting you back…</p>
        </>
      )}
    </div>
  );
}
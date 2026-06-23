import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail, ArrowLeft } from "lucide-react";
import { dotApi } from "@/api/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Reset password — DOT" }],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Read ?token= from the URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  // ── Set new password (user arrived via reset link) ────────
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await dotApi.post("/api/auth/reset-password", { token, newPassword: password });
      toast.success("Password updated. You can now sign in.");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  // ── Request reset link (user landed without a token) ──────
  async function handleRequestLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await dotApi.post("/api/auth/forgot-password", { email });
      setRequestSent(true);
    } catch {
      // Always show success — don't reveal if email exists
      setRequestSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">

          {/* ── Has token: set new password ── */}
          {token ? (
            <>
              <h1 className="font-display text-2xl font-bold">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a strong password for your account.
              </p>
              <form onSubmit={handleSetPassword} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Same password again"
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                  Update password
                </Button>
              </form>
            </>
          ) : requestSent ? (
            /* ── Reset link sent ── */
            <>
              <h1 className="font-display text-2xl font-bold">Check your email</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                If an account exists for that email, we've sent a reset link. Check your inbox and
                spam folder.
              </p>
              <Button variant="outline" className="mt-6 w-full" asChild>
                <Link to="/auth">
                  <ArrowLeft className="size-4" /> Back to sign in
                </Link>
              </Button>
            </>
          ) : (
            /* ── No token: request a reset link ── */
            <>
              <h1 className="font-display text-2xl font-bold">Forgot your password?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={handleRequestLink} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                  Send reset link
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link to="/auth" className="font-medium text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

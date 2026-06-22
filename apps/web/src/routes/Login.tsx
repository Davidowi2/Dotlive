import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext.js";
import { ApiError } from "../api/client.js";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionExpired = params.get("expired") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-12 text-[var(--text)]">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center font-display text-xl font-bold">
          <span className="text-[var(--primary)]">●</span> dotlive
        </Link>
        <div className="glass rounded-2xl p-8">
          {sessionExpired && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-xs text-[var(--gold)]">
              Your session expired. Please log in again.
            </div>
          )}
          <h1 className="font-display text-3xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Log in to keep building.</p>

          <a href="/api/auth/google" className="btn-ghost mt-6 flex w-full items-center justify-center gap-2">
            <GoogleMark /> Continue with Google
          </a>

          <div className="my-6 flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            OR
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2.5 outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2.5 outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
              {busy ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            New to DOT?{" "}
            <Link to="/signup" className="text-[var(--primary)] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path fill="#EA4335" d="M12 11v3.2h4.5c-.2 1-1.2 3-4.5 3-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5c1.5 0 2.6.6 3.2 1.2l2.2-2.1C15.9 4.9 14.1 4 12 4 8 4 4.8 7.2 4.8 11s3.2 7 7.2 7c4.2 0 6.9-2.9 6.9-7 0-.5 0-.8-.1-1H12z" />
    </svg>
  );
}

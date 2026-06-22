import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "../api/client.js";
import { toast } from "sonner";

/**
 * Google OAuth redirect target.
 * The backend appends `?token=...` to this URL after a successful
 * Google sign-in. We stash the token in localStorage, fetch /auth/me,
 * and redirect to /dashboard.
 */
export function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = params.get("token");
    if (!token) {
      toast.error("Google sign-in failed: missing token");
      navigate("/login", { replace: true });
      return;
    }
    setToken(token);
    // The AuthProvider will pick up the token on mount.
    navigate("/dashboard", { replace: true });
  }, [params, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
      <div className="text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        <p className="mt-4 text-sm text-[var(--text-muted)]">Signing you in with Google…</p>
      </div>
    </div>
  );
}

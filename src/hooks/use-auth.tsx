/**
 * use-auth.tsx — BACKWARDS-COMPATIBLE SHIM.
 *
 * The original `useAuth` hook was backed by Supabase auth.
 * We migrated to a custom JWT-based auth on Render/Neon (see DotAuthContext).
 *
 * This file is kept to preserve the old API shape so the 6 routes
 * that still import `useAuth` (demo, investor, meetings, sessions,
 * onboarding, join.$code) don't break while we migrate them.
 *
 * IMPORTANT: The shape returned is intentionally compatible with
 * the Supabase-based version (session/user/roles) so component code
 * that reads `user.id`, `roles`, `profile` keeps working.
 *
 * MIGRATION PLAN:
 * - Routes that ONLY need {user.id, roles, isLoading} → swap to useDotAuth directly
 * - Routes that need realtime Supabase features → must be rewritten to use
 *   Render API equivalents OR stay broken until replaced
 */

import { useMemo, useCallback, type ReactNode } from "react";
import { useDotAuth } from "@/contexts/DotAuthContext";
import type { AppRole } from "@/lib/constants";

/* Map Render role strings to the AppRole enum used by the legacy code.
 * Render returns lowercase role strings; AppRole is a typed union. */
function normalizeRoles(raw: string[]): AppRole[] {
  const allowed: AppRole[] = ["admin", "community_leader", "investor", "founder"];
  return raw
    .map((r) => r.toLowerCase() as AppRole)
    .filter((r) => allowed.includes(r));
}

/**
 * Returns an AuthContext-compatible object built from useDotAuth().
 * Note: `session` is always null here — Render uses JWT in localStorage,
 * not a Supabase-style Session object. Components reading `session`
 * directly will get null and should be migrated.
 */
export function useAuth() {
  const { user, token, roles: dotRoles, isLoading, refresh, logout } = useDotAuth();
  const roles = useMemo(() => normalizeRoles(dotRoles), [dotRoles]);
  const primaryRole = useMemo<AppRole | null>(() => {
    const priority: AppRole[] = ["admin", "community_leader", "investor", "founder"];
    return priority.find((r) => roles.includes(r)) ?? null;
  }, [roles]);

  return {
    user: user
      ? {
          id: user.id,
          email: user.email ?? "",
          // Render API doesn't give us the Supabase User shape — provide enough
          // for legacy code that reads user.id, user.email, user.user_metadata
          user_metadata: { name: user.name ?? null, avatar_url: user.avatarUrl ?? null },
        }
      : null,
    session: null, // legacy field — no longer applicable
    profile: user
      ? {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          phone: null,
          avatar_url: user.avatarUrl ?? null,
        }
      : null,
    roles,
    primaryRole,
    loading: isLoading,
    refresh,
    signOut: logout,
    // extras so consumers can migrate gradually
    token,
  };
}

/**
 * AuthProvider is a no-op pass-through now. The actual auth context
 * is mounted in `__root.tsx` via DotAuthProvider. This stub exists
 * so old code that wraps with <AuthProvider> doesn't crash.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/* Legacy types — kept so legacy imports still compile. */
export type { AppRole };
export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

// Re-export for back-compat (some files imported the unused pieces)
export const _authShimInfo = "use-auth is now a shim over DotAuthContext";
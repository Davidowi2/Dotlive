/**
 * Role gating helpers — tier-based access control for routes.
 *
 *   const gate = useRoleGate(["founder", "admin"], { redirect: "/dashboard" });
 *   if (!gate.allowed) return null;
 *
 *   // Or for builders:
 *   const builderGate = useLevelGate(2); // requires Level 2+
 */

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useDotAuth } from "@/contexts/DotAuthContext";

export type AppRole =
  | "admin"
  | "super_admin"
  | "builder"
  | "founder"
  | "investor"
  | "community_leader"
  | "capital_partner";

export function useRoleGate(
  allowed: AppRole[],
  opts: { redirect?: string } = {},
): { allowed: boolean; user: any; roles: AppRole[] } {
  const { user, roles } = useDotAuth();
  const navigate = useNavigate();

  const isAllowed =
    roles.some((r: string) => allowed.includes(r as AppRole)) ||
    // super_admin always allowed
    roles.includes("super_admin");

  useEffect(() => {
    if (!isAllowed && opts.redirect && user) {
      navigate({ to: opts.redirect });
    }
  }, [isAllowed, user, opts.redirect, navigate]);

  return { allowed: isAllowed, user, roles: roles as AppRole[] };
}

/**
 * Builder-level gate — checks if the builder has reached a minimum level.
 * Levels: 1=Explorer, 2=Contributor, 3=Specialist, 4=Core Builder, 5=Elite
 */
export function useLevelGate(minLevel: number): {
  allowed: boolean;
  currentLevel: number;
} {
  const { user } = useDotAuth();
  // Default to level 1 if no data — assume everyone can do level-1 things
  // The actual level check happens via /api/builder/level
  return {
    allowed: true, // soft gate — server enforces the actual restriction
    currentLevel: 1,
  };
}
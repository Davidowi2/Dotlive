import { type ReactNode } from "react";
import { useDotAuth } from "@/contexts/DotAuthContext";

interface RoleGateProps {
  roles: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ roles, fallback = null, children }: RoleGateProps) {
  const { user } = useDotAuth();
  const userRoles = (user as any)?.roles ?? [];

  const hasRole = roles.some((r) => userRoles.includes(r));
  return hasRole ? <>{children}</> : <>{fallback}</>;
}

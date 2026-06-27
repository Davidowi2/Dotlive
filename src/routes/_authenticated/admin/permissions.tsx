/**
 * /admin/permissions — Role & permission matrix.
 *
 * Shows what each staff role can do. Lets super-admins grant
 * moderator / support / finance roles to users. Read-only for
 * regular admins.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Check, X, Users as UsersIcon, Wallet, FileText, Building2,
  AlertTriangle, Headphones, Banknote, Lock,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { dotApi } from "@/api/client";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/permissions")({
  head: () => ({ meta: [{ title: "Permissions — Admin — DOT" }] }),
  component: PermissionsPage,
});

interface RoleMeta {
  role: string;
  label: string;
  description: string;
  color: "emerald" | "blue" | "purple" | "amber" | "red" | "slate";
  isStaff: boolean;
  rank: number;
  permissions: string[];
}

interface PermissionGroup {
  category: string;
  permissions: Array<{ key: string; label: string; description: string }>;
}

const COLOR_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  blue:    "bg-blue-500/10 text-blue-500 border-blue-500/30",
  purple:  "bg-purple-500/10 text-purple-500 border-purple-500/30",
  amber:   "bg-amber-500/10 text-amber-500 border-amber-500/30",
  red:     "bg-red-500/10 text-red-500 border-red-500/30",
  slate:   "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const CATEGORY_ICONS: Record<string, any> = {
  Users: UsersIcon,
  "Wallets & DOT": Wallet,
  Content: FileText,
  Communities: Building2,
  Ventures: AlertTriangle,
  "Events / Demo": AlertTriangle,
  "Audit & System": Shield,
  Support: Headphones,
  Finance: Banknote,
};

function PermissionsPage() {
  const { roles: callerRoles } = useDotAuth();
  const isSuperAdmin = callerRoles.includes("super_admin");

  const hierQ = useQuery({
    queryKey: ["admin", "roles-hierarchy"],
    queryFn: () => dotApi.get<{ roles: RoleMeta[]; staffRoles: RoleMeta[]; permissionGroups: PermissionGroup[] }>("/api/admin/roles/hierarchy"),
  });

  const staffRoles = hierQ.data?.staffRoles ?? [];
  const groups = hierQ.data?.permissionGroups ?? [];

  if (hierQ.isLoading) {
    return (
      <>
        <div className="mb-6">
          <h1 className="font-display text-3xl">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Loading permission matrix…</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </>
    );
  }

  if (!hierQ.data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="font-medium">Could not load permission matrix</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Roles & Permissions</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            DOT has {staffRoles.length} staff roles — each is a focused permission set so you can give
            someone exactly the access they need. Higher-ranked roles automatically inherit all
            permissions of lower-ranked ones.
          </p>
        </div>
      </div>

      {/* Roles overview */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg">Staff roles</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {staffRoles.map((role) => (
            <Card key={role.role} className={cn("border", COLOR_CLASSES[role.color])}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge className={cn("border", COLOR_CLASSES[role.color])}>
                    {role.label}
                  </Badge>
                  <Lock className="size-3.5 opacity-50" />
                </div>
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  {role.description}
                </p>
                <p className="mt-3 text-xs font-medium tabular-nums">
                  {role.permissions.length} permissions
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Permission matrix */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg">Permission matrix</h2>
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="sticky left-0 z-10 bg-muted/30 p-3 text-left font-medium">Permission</th>
                  {staffRoles.map((r) => (
                    <th key={r.role} className="p-3 text-center font-medium">
                      <div className={cn("mx-auto inline-block rounded-md px-2 py-0.5 text-xs", COLOR_CLASSES[r.color])}>
                        {r.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <>
                    <tr key={`head-${group.category}`} className="border-b border-border bg-muted/10">
                      <td colSpan={staffRoles.length + 1} className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.category}
                      </td>
                    </tr>
                    {group.permissions.map((perm) => (
                      <tr key={perm.key} className="border-b border-border/40 last:border-0">
                        <td className="sticky left-0 bg-card p-3 align-top">
                          <p className="font-medium">{perm.label}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{perm.description}</p>
                          <code className="mt-1 inline-block text-[10px] text-muted-foreground">{perm.key}</code>
                        </td>
                        {staffRoles.map((role) => {
                          const has = role.permissions.includes(perm.key);
                          return (
                            <td key={role.role} className="p-3 text-center align-middle">
                              {has ? (
                                <Check className="mx-auto size-4 text-emerald-500" />
                              ) : (
                                <X className="mx-auto size-3.5 text-muted-foreground/40" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Role ladder */}
      <section>
        <h2 className="mb-3 font-display text-lg">Role hierarchy</h2>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {staffRoles.map((role, i) => (
                <div key={role.role} className="flex items-center gap-2">
                  <Badge className={cn("shrink-0 border", COLOR_CLASSES[role.color])}>
                    {role.label}
                  </Badge>
                  {i < staffRoles.length - 1 && <span className="text-muted-foreground">›</span>}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              <strong className="text-foreground">{staffRoles[staffRoles.length - 1]?.label}</strong> sits at the top — same powers as Admin plus the ability to grant admin and mint DOT.
              Like the WhatsApp group creator, the super admin cannot be removed, banned, or self-demoted.
              Only a super admin can grant admin, super admin, finance, or moderator roles.
            </p>
          </CardContent>
        </Card>
      </section>

      {!isSuperAdmin && (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium">Read-only view</p>
              <p className="mt-1 text-xs text-muted-foreground">
                You're seeing this page as an Admin. To grant staff roles, ask a super admin
                (browserverify@test.com) to do it from this same page or the Members page.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * /admin/roles — Super-admin only. Role hierarchy + recent audit log.
 */

import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Loader2, Users as UsersIcon, Lock } from "lucide-react";

import { useDotAuth } from "@/contexts/DotAuthContext";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { getRoleHierarchy, type RoleHierarchy } from "@/api/admin-tools";
import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => ({ meta: [{ title: "Roles — Admin — DOT" }] }),
  component: AdminRolesPage,
});

function AdminRolesPage() {
  const { roles: myRoles } = useDotAuth();
  const isSuperAdmin = myRoles.includes("super_admin");

  const { data: hierarchy, isLoading } = useQuery({
    queryKey: ["admin", "hierarchy"],
    queryFn: getRoleHierarchy,
  });

  const { data: auditData } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => dotApi.get("/api/admin/audit?limit=50"),
    refetchInterval: 30_000,
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <Lock className="mx-auto size-12 text-muted-foreground" />
        <h2 className="mt-4 font-display text-2xl">Super admin only</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The role hierarchy and audit log are only visible to super admins.
        </p>
        <Link to="/admin" className="mt-6 inline-block text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (isLoading || !hierarchy) {
    return <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>;
  }

  const entries = Object.entries(hierarchy.hierarchy);
  const auditLogs = (auditData as any)?.logs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Roles & Hierarchy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Role grants and removals follow these rules. All changes are audited.
        </p>
      </div>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <RuleBadge ok={hierarchy.rules.lastSuperAdminProtection} label="Last super admin cannot be removed" />
            <RuleBadge ok={hierarchy.rules.nonSuperAdminCannotGrantAdmin} label="Non-super cannot grant admin" />
            <RuleBadge ok={hierarchy.rules.adminRoleChangesAudited} label="All role changes audited" />
            <RuleBadge ok={!hierarchy.rules.superAdminSelfBan} label="Super admin cannot be self-banned" />
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <ShieldAlert className="size-4 text-amber-500" />
            <span>Current super admins: <strong>{hierarchy.stats.totalSuperAdmins}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Grantable by</th>
                  <th className="px-3 py-2 text-left">Removable by</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(([role, info]) => (
                  <tr key={role} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={role === "super_admin" ? "default" : role === "admin" ? "secondary" : "outline"}>
                          {role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{info.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{info.description ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">
                      {info.grantableBy.map((g) => (
                        <Badge key={g} variant="outline" className="mr-1 text-[10px]">{g}</Badge>
                      ))}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {info.removableBy.map((g) => (
                        <Badge key={g} variant="outline" className="mr-1 text-[10px]">{g}</Badge>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent audit log</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No role changes recorded yet.</div>
          ) : (
            <ul className="space-y-2">
              {auditLogs.slice(0, 25).map((log: any) => (
                <li key={log.id} className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                      <span>{log.actorEmail}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono text-xs">{log.targetId?.slice(0, 8) ?? "—"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {log.reason && <div className="mt-1 text-xs text-muted-foreground">{log.reason}</div>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RuleBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
      ok ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-muted/20 text-muted-foreground"
    )}>
      <span className={cn("size-2 rounded-full", ok ? "bg-primary" : "bg-muted-foreground/30")} />
      {label}
    </div>
  );
}

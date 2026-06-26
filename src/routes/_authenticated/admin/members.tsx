/**
 * /admin/members — All profiles, with search + role filtering.
 * Admins can promote/demote other admins; everyone can view.
 */

import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Loader2, ChevronUp, ChevronDown, ShieldCheck, ShieldAlert,
  MoreHorizontal, Ban, ArrowUpRight, ArrowDownRight, UserCheck, UserX,
} from "lucide-react";

import { useDotAuth } from "@/contexts/DotAuthContext";
import { AppShell } from "@/components/app/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/app/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { listAdminUsers, banUser, unbanUser, getAdminStats, type AdminUser } from "@/api/admin";
import {
  promoteUser, demoteUser, getRoleHierarchy, type RoleHierarchy,
} from "@/api/admin-tools";

export const Route = createFileRoute("/_authenticated/admin/members")({
  head: () => ({ meta: [{ title: "Members — Admin — DOT" }] }),
  component: AdminMembersPage,
});

function AdminMembersPage() {
  const { roles: myRoles } = useDotAuth();
  const isSuperAdmin = myRoles.includes("super_admin");
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "admins" | "banned" | "builders" | "founders" | "investors" | "community_leaders" | "capital_partners" | "vendors">("all");
  const [sort, setSort] = useState<"newest" | "name" | "balance">("newest");
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "members", { filter, sort, page }],
    queryFn: () => listAdminUsers({
      search: search || undefined,
      role: filter === "all" || filter === "banned" || filter === "admins" ? undefined : filter,
      sort,
      page,
      limit,
    }),
  });

  const { data: hierarchy } = useQuery({
    queryKey: ["admin", "hierarchy"],
    queryFn: getRoleHierarchy,
  });

  const users: AdminUser[] = (data as any)?.users ?? [];
  const totalCount = (data as any)?.total ?? users.length;

  async function handleBan(user: AdminUser) {
    if (!confirm(`Ban ${user.email}? They will be unable to sign in.`)) return;
    try {
      await banUser(user.id, "Banned via admin console");
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success(`${user.email} banned`);
    } catch (e: any) { toast.error(e?.message ?? "Ban failed"); }
  }
  async function handleUnban(user: AdminUser) {
    try {
      await unbanUser(user.id);
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success(`${user.email} unbanned`);
    } catch (e: any) { toast.error(e?.message ?? "Unban failed"); }
  }
  async function handlePromote(user: AdminUser) {
    const newRole = user.isSuperAdmin ? "admin" : "admin"; // always promote TO admin (super is special)
    if (user.isAdmin && !user.isSuperAdmin) {
      // Already admin — skip
      return toast.error(`${user.email} is already an admin`);
    }
    try {
      await promoteUser(user.id, { role: "admin", reason: "Promoted via admin console" });
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      qc.invalidateQueries({ queryKey: ["admin", "hierarchy"] });
      toast.success(`${user.email} promoted to admin`);
    } catch (e: any) { toast.error(e?.message ?? "Promote failed"); }
  }
  async function handleDemote(user: AdminUser) {
    if (user.isSuperAdmin && user.isLastSuperAdmin) {
      return toast.error("Cannot demote the last super admin");
    }
    if (!confirm(`Remove admin role from ${user.email}?`)) return;
    try {
      await demoteUser(user.id, { role: "admin", reason: "Demoted via admin console" });
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      qc.invalidateQueries({ queryKey: ["admin", "hierarchy"] });
      toast.success(`${user.email} demoted`);
    } catch (e: any) { toast.error(e?.message ?? "Demote failed"); }
  }

  const filterButtons: Array<{ key: typeof filter; label: string; count?: number }> = [
    { key: "all", label: "All" },
    { key: "admins", label: "Admins" },
    { key: "builders", label: "Builders" },
    { key: "founders", label: "Founders" },
    { key: "investors", label: "Investors" },
    { key: "capital_partners", label: "Capital Partners" },
    { key: "community_leaders", label: "Communities" },
    { key: "vendors", label: "Vendors" },
    { key: "banned", label: "Banned" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All profiles on the platform. <strong>{totalCount}</strong> total.
            {isSuperAdmin
              ? " You can promote/demote admins."
              : " Role changes require super admin."}
          </p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or DOT ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((b) => (
            <Button
              key={b.key}
              size="sm"
              variant={filter === b.key ? "default" : "outline"}
              onClick={() => { setFilter(b.key); setPage(1); }}
              className="h-8"
            >
              {b.label}
            </Button>
          ))}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSort(sort === "newest" ? "name" : sort === "name" ? "balance" : "newest")} className="h-8">
              Sort: {sort}
              {sort === "newest" ? <ChevronDown className="ml-1 size-3" /> : <ChevronUp className="ml-1 size-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : users.length === 0 ? (
          <EmptyState title="No members match" subtitle="Try a different search or filter." icon={Search} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">DOT ID</th>
                  <th className="px-4 py-3 text-left">Roles</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
                          {(u.name ?? u.email ?? "?").slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium">{u.name ?? "—"}</span>
                            {u.isSuperAdmin && <ShieldAlert className="size-3.5 text-amber-500" />}
                            {u.bannedAt && <Ban className="size-3.5 text-destructive" />}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.dotId ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(u.roles ?? []).length === 0
                          ? <span className="text-xs text-muted-foreground">No roles</span>
                          : (u.roles ?? []).slice(0, 3).map((r) => (
                            <Badge key={r} variant={r === "super_admin" ? "default" : r === "admin" ? "secondary" : "outline"} className="text-[10px]">
                              {r}
                            </Badge>
                          ))
                        }
                        {(u.roles ?? []).length > 3 && (
                          <span className="text-xs text-muted-foreground">+{u.roles.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {Number(u.balance ?? 0).toLocaleString()} DOT
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {u.bannedAt ? (
                          <Button size="sm" variant="ghost" onClick={() => handleUnban(u)} title="Unban">
                            <UserCheck className="size-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleBan(u)} title="Ban" disabled={u.isSuperAdmin}>
                            <UserX className="size-4 text-destructive" />
                          </Button>
                        )}
                        {isSuperAdmin && !u.bannedAt && (
                          u.isAdmin ? (
                            <Button size="sm" variant="ghost" onClick={() => handleDemote(u)} title="Demote" disabled={u.isLastSuperAdmin}>
                              <ArrowDownRight className="size-4 text-amber-500" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => handlePromote(u)} title="Promote to admin">
                              <ArrowUpRight className="size-4 text-primary" />
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          Showing {(page - 1) * limit + 1}-{Math.min(page * limit, totalCount)} of {totalCount}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <Button size="sm" variant="outline" disabled={page * limit >= totalCount} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}

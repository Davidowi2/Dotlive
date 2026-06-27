/**
 * /admin/members — All users with roles, balances, and ban controls.
 *
 * Lists every user with their roles (color-coded badges), DOT balance,
 * created-at date, and admin actions (promote/demote/ban). The super
 * admin sees everything; regular admins cannot touch other admins.
 *
 * Includes a "Manage Roles" dialog where admin can grant/remove any
 * non-staff role (founder, builder, investor, community_leader,
 * capital_partner, vendor) — staff roles (admin, super_admin,
 * moderator, support, finance) are managed via the dedicated
 * Roles / Permissions pages.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Users, Search, Shield, ShieldOff, UserCheck, UserX, AlertCircle,
  ChevronRight, RefreshCw, Loader2, Sparkles, X, Check,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/EmptyState";
import { dotApi } from "@/api/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/members")({
  head: () => ({ meta: [{ title: "Members — Admin — DOT" }] }),
  component: AdminMembersPage,
});

interface MemberRow {
  id: string;
  email: string;
  name: string | null;
  dotId: string;
  avatarUrl: string | null;
  roles: string[];
  balance: number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLastSuperAdmin: boolean;
  bannedAt: string | null;
  createdAt: string;
}

const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline" | "muted"> = {
  super_admin: "destructive",
  admin: "default",
  moderator: "secondary",
  support: "secondary",
  finance: "secondary",
  founder: "default",
  builder: "secondary",
  investor: "outline",
  capital_partner: "default",
  community_leader: "default",
  vendor: "outline",
};

/** Roles an admin can grant/remove from the Members page (non-staff). */
const ASSIGNABLE_ROLES = [
  { value: "founder", label: "Founder", desc: "Builds ventures, pitches at Demo Day", icon: Sparkles, cost: "500 DOT/yr" },
  { value: "builder", label: "Builder", desc: "Free — joins teams, earns DOT", icon: Users, cost: "Free" },
  { value: "investor", label: "Investor", desc: "Browses, saves, follows ventures", icon: Users, cost: "Free" },
  { value: "community_leader", label: "Community Leader", desc: "Runs a community, can verify others", icon: Users, cost: "Free" },
  { value: "capital_partner", label: "Capital Partner", desc: "Commits funds, hosts events", icon: Users, cost: "Free" },
  { value: "vendor", label: "Vendor", desc: "Sells services in DOT Work", icon: Users, cost: "Free" },
] as const;

const FILTERS = [
  { value: "all", label: "All" },
  { value: "admins", label: "Admins" },
  { value: "builders", label: "Builders" },
  { value: "founders", label: "Founders" },
  { value: "investors", label: "Investors" },
  { value: "capital_partners", label: "Capital Partners" },
  { value: "communities", label: "Communities" },
  { value: "banned", label: "Banned" },
] as const;

function AdminMembersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<typeof FILTERS[number]["value"]>("all");
  const [manageRolesFor, setManageRolesFor] = useState<MemberRow | null>(null);

  const membersQ = useQuery({
      queryKey: ["admin", "members"],
      queryFn: async () => {
        // Backend returns { users: MemberRow[], nextCursor, total }
        const res = await dotApi.get<{ users: MemberRow[]; nextCursor: string | null; total: number }>(
          "/api/admin/users?limit=100",
        );
        return res.users ?? [];
      },
    });

  const filtered = useMemo(() => {
    const list = membersQ.data ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((m) => {
      // Text search
      if (q) {
        const hit =
          m.email.toLowerCase().includes(q) ||
          (m.name ?? "").toLowerCase().includes(q) ||
          m.dotId.toLowerCase().includes(q);
        if (!hit) return false;
      }
      // Filter
      switch (filter) {
        case "all": return true;
        case "admins": return m.roles.includes("admin") || m.roles.includes("super_admin");
        case "builders": return m.roles.includes("builder") && !m.roles.includes("admin");
        case "founders": return m.roles.includes("founder");
        case "investors": return m.roles.includes("investor");
        case "capital_partners": return m.roles.includes("capital_partner");
        case "communities": return m.roles.includes("community_leader");
        case "banned": return !!m.bannedAt;
      }
      return true;
    });
  }, [membersQ.data, search, filter]);

  // Promote = grant admin role (super-admin only)
  const promoteMut = useMutation({
    mutationFn: async (userId: string) =>
      dotApi.put(`/api/admin/users/${userId}/roles`, { add: ["admin"] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success("Promoted to admin");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not promote"),
  });

  const demoteMut = useMutation({
    mutationFn: async (userId: string) =>
      dotApi.put(`/api/admin/users/${userId}/roles`, { remove: ["admin"] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success("Demoted from admin");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not demote"),
  });

  const banMut = useMutation({
    mutationFn: async (userId: string) =>
      dotApi.post(`/api/admin/users/${userId}/ban`, { reason: "Banned by admin" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success("User banned");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not ban"),
  });

  const unbanMut = useMutation({
    mutationFn: async (userId: string) =>
      dotApi.post(`/api/admin/users/${userId}/unban`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success("User unbanned");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not unban"),
  });

  return (
    <>
      <PageHeader
        title="Members"
        subtitle={`${membersQ.data?.length ?? 0} users · promote, demote, ban, assign roles`}
        action={
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin", "members"] })}>
            <RefreshCw className="size-4" />
          </Button>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-4 sm:space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or DOT ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Members list */}
        {membersQ.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members match"
            description="Try removing a filter or search term."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                onPromote={() => promoteMut.mutate(m.id)}
                onDemote={() => demoteMut.mutate(m.id)}
                onBan={() => banMut.mutate(m.id)}
                onUnban={() => unbanMut.mutate(m.id)}
                onManageRoles={() => setManageRolesFor(m)}
                busy={
                  promoteMut.isPending ||
                  demoteMut.isPending ||
                  banMut.isPending ||
                  unbanMut.isPending
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Manage roles dialog */}
      {manageRolesFor && (
        <ManageRolesDialog
          member={manageRolesFor}
          onClose={() => setManageRolesFor(null)}
        />
      )}
    </>
  );
}

function MemberCard({
  member,
  onPromote,
  onDemote,
  onBan,
  onUnban,
  onManageRoles,
  busy,
}: {
  member: MemberRow;
  onPromote: () => void;
  onDemote: () => void;
  onBan: () => void;
  onUnban: () => void;
  onManageRoles: () => void;
  busy: boolean;
}) {
  return (
    <Card className={member.bannedAt ? "border-destructive/30 bg-destructive/5" : undefined}>
      <CardContent className="p-3 sm:p-4">
        {/* Mobile layout: stacked */}
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <Avatar className="size-9 shrink-0 sm:size-10">
            <AvatarFallback>
              {(member.name?.[0] ?? member.email[0] ?? "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate text-sm sm:text-base">
                {member.name ?? member.email}
              </p>
              {member.bannedAt && (
                <Badge variant="destructive" className="text-[10px]">BANNED</Badge>
              )}
              {member.isSuperAdmin && (
                <Badge variant="destructive" className="text-[10px]">SUPER</Badge>
              )}
              {member.isAdmin && !member.isSuperAdmin && (
                <Badge variant="default" className="text-[10px]">ADMIN</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {member.email}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {member.roles.length === 0 ? (
                <Badge variant="outline" className="text-[10px]">no role</Badge>
              ) : (
                member.roles.map((r) => (
                  <Badge
                    key={r}
                    variant={ROLE_COLORS[r] ?? "muted"}
                    className="text-[10px]"
                  >
                    {r.replace(/_/g, " ")}
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* Balance + dotId — desktop only */}
          <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0">
            <p className="text-sm font-semibold tabular-nums">
              {member.balance.toLocaleString()} DOT
            </p>
            <p className="text-[10px] text-muted-foreground font-mono">{member.dotId}</p>
          </div>
        </div>

        {/* Mobile balance row */}
        <div className="mt-2 flex items-center justify-between gap-2 md:hidden">
          <p className="text-xs text-muted-foreground font-mono truncate">
            {member.dotId}
          </p>
          <p className="text-xs font-semibold tabular-nums shrink-0">
            {member.balance.toLocaleString()} DOT
          </p>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onManageRoles}
            disabled={busy || member.isSuperAdmin}
          >
            <Sparkles className="size-3.5" />
            Manage roles
          </Button>
          {!member.isAdmin && !member.isSuperAdmin && (
            <Button size="sm" variant="outline" onClick={onPromote} disabled={busy}>
              <Shield className="size-3.5" />
              <span className="hidden sm:inline">Make admin</span>
              <span className="sm:hidden">Admin</span>
            </Button>
          )}
          {member.isAdmin && !member.isSuperAdmin && (
            <Button size="sm" variant="outline" onClick={onDemote} disabled={busy}>
              <ShieldOff className="size-3.5" />
              <span className="hidden sm:inline">Remove admin</span>
              <span className="sm:hidden">Remove</span>
            </Button>
          )}
          {member.bannedAt ? (
            <Button size="sm" variant="outline" onClick={onUnban} disabled={busy}>
              <UserCheck className="size-3.5" />
              Unban
            </Button>
          ) : (
            !member.isSuperAdmin && (
              <Button size="sm" variant="outline" onClick={onBan} disabled={busy}>
                <UserX className="size-3.5" />
                Ban
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────── Manage Roles Dialog ────────────────────────── */

function ManageRolesDialog({
  member,
  onClose,
}: {
  member: MemberRow;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  // Optimistic update
  const [localRoles, setLocalRoles] = useState<string[]>(member.roles);

  const hasRole = (r: string) => localRoles.includes(r);
  const isStaff = (r: string) =>
    ["admin", "super_admin", "moderator", "support", "finance"].includes(r);

  const toggle = async (role: string) => {
    if (isStaff(role)) {
      toast.error(
        "Use the Roles page to manage admin / moderator / support / finance roles",
      );
      return;
    }
    if (member.isSuperAdmin && role !== "admin") {
      toast.error("Super admin role is immutable — cannot be modified");
      return;
    }
    const already = hasRole(role);
    setBusy(role);
    // optimistic update
    setLocalRoles((prev) =>
      already ? prev.filter((r) => r !== role) : [...prev, role],
    );
    try {
      await dotApi.put(`/api/admin/users/${member.id}/roles`, {
        [already ? "remove" : "add"]: [role],
      });
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success(
        already ? `Removed ${role.replace(/_/g, " ")}` : `Added ${role.replace(/_/g, " ")}`,
      );
    } catch (e: any) {
      // rollback
      setLocalRoles((prev) =>
        already ? [...prev, role] : prev.filter((r) => r !== role),
      );
      toast.error(e?.message ?? "Could not update role");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Manage roles</h2>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {member.name ?? member.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {localRoles.length === 0 ? (
                <Badge variant="outline" className="text-[10px]">no role</Badge>
              ) : (
                localRoles.map((r) => (
                  <Badge
                    key={r}
                    variant={ROLE_COLORS[r] ?? "muted"}
                    className="text-[10px]"
                  >
                    {r.replace(/_/g, " ")}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        {/* Role list */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Assignable roles
          </p>
          <div className="space-y-2">
            {ASSIGNABLE_ROLES.map((r) => {
              const active = hasRole(r.value);
              const Icon = r.icon;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggle(r.value)}
                  disabled={busy === r.value || member.isSuperAdmin}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    active
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:bg-muted/40",
                    (busy === r.value || member.isSuperAdmin) && "opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {busy === r.value ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : active ? (
                      <Check className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{r.label}</p>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {r.cost}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Staff roles note */}
          <p className="mt-5 mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Staff roles
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Admin, super_admin, moderator, support, and finance roles are managed
            on the{" "}
            <Link to="/admin/roles" className="text-primary hover:underline">
              Roles page
            </Link>
            {" "}and{" "}
            <Link to="/admin/permissions" className="text-primary hover:underline">
              Permissions page
            </Link>
            . Super admin role is immutable.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border p-4 sm:p-5">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

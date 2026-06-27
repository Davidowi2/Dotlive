/**
 * /admin/members — All users with roles, balances, and ban controls.
 *
 * Lists every user with their roles (color-coded badges), DOT balance,
 * created-at date, and admin actions (promote/demote/ban). The super
 * admin sees everything; regular admins cannot touch other admins.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Users, Search, Shield, ShieldOff, UserCheck, UserX, AlertCircle,
  ChevronRight, RefreshCw, Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app/AppShell";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/EmptyState";

import { dotApi } from "@/api/client";

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

const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  super_admin: "destructive",
  admin: "default",
  founder: "secondary",
  builder: "secondary",
  investor: "secondary",
  community_leader: "secondary",
  capital_partner: "default",
  vendor: "outline",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "admins", label: "Admins" },
  { value: "builders", label: "Builders" },
  { value: "founders", label: "Founders" },
  { value: "investors", label: "Investors" },
  { value: "capital_partners", label: "Capital Partners" },
  { value: "communities", label: "Communities" },
  { value: "banned", label: "Banned" },
];

function AdminMembersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const membersQ = useQuery({
    queryKey: ["admin", "members"],
    queryFn: async () => {
      const res = await dotApi.get<{ users: MemberRow[] }>("/api/admin/users");
      return res.users ?? [];
    },
  });

  const promoteMut = useMutation({
    mutationFn: async (userId: string) =>
      dotApi.post(`/api/admin/users/${userId}/promote`, { role: "admin" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success("Promoted to admin");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not promote"),
  });

  const demoteMut = useMutation({
    mutationFn: async (userId: string) =>
      dotApi.post(`/api/admin/users/${userId}/demote`, { role: "builder" }),
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
      dotApi.post(`/api/admin/users/${userId}/unban`, { reason: "Unbanned by admin" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success("User unbanned");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not unban"),
  });

  const filtered = (membersQ.data ?? []).filter((m) => {
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      if (
        !m.email.toLowerCase().includes(s) &&
        !(m.name?.toLowerCase().includes(s) ?? false) &&
        !m.dotId.toLowerCase().includes(s)
      ) {
        return false;
      }
    }
    // Role/category filter
    switch (filter) {
      case "all":
        return true;
      case "admins":
        return m.isAdmin;
      case "builders":
        return m.roles.includes("builder");
      case "founders":
        return m.roles.includes("founder");
      case "investors":
        return m.roles.includes("investor");
      case "capital_partners":
        return m.roles.includes("capital_partner");
      case "communities":
        return m.roles.includes("community_leader");
      case "banned":
        return !!m.bannedAt;
      default:
        return true;
    }
  });

  return (
    <AppShell>
      <PageHeader
        title="Members"
        subtitle={`${membersQ.data?.length ?? 0} users · promote, demote, ban`}
        action={
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["admin", "members"] })}>
            <RefreshCw className="size-4" />
          </Button>
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
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
                busy={promoteMut.isPending || demoteMut.isPending || banMut.isPending || unbanMut.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function MemberCard({
  member,
  onPromote,
  onDemote,
  onBan,
  onUnban,
  busy,
}: {
  member: MemberRow;
  onPromote: () => void;
  onDemote: () => void;
  onBan: () => void;
  onUnban: () => void;
  busy: boolean;
}) {
  return (
    <Card className={member.bannedAt ? "border-destructive/30 bg-destructive/5" : undefined}>
      <CardContent className="p-4 flex items-center gap-4">
        <Avatar className="size-10 shrink-0">
          <AvatarFallback>
            {(member.name?.[0] ?? member.email[0] ?? "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">
              {member.name ?? member.email}
            </p>
            {member.bannedAt && (
              <Badge variant="destructive" className="text-[10px]">BANNED</Badge>
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

        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          <p className="text-sm font-semibold tabular-nums">
            {member.balance.toLocaleString()} DOT
          </p>
          <p className="text-[10px] text-muted-foreground">{member.dotId}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!member.isAdmin && (
            <Button size="sm" variant="outline" onClick={onPromote} disabled={busy}>
              <Shield className="size-3.5" /> Promote
            </Button>
          )}
          {member.isAdmin && !member.isSuperAdmin && (
            <Button size="sm" variant="outline" onClick={onDemote} disabled={busy}>
              <ShieldOff className="size-3.5" /> Demote
            </Button>
          )}
          {member.bannedAt ? (
            <Button size="sm" variant="outline" onClick={onUnban} disabled={busy}>
              <UserCheck className="size-3.5" /> Unban
            </Button>
          ) : (
            !member.isSuperAdmin && (
              <Button size="sm" variant="outline" onClick={onBan} disabled={busy}>
                <UserX className="size-3.5" /> Ban
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
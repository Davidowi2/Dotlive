/**
 * /admin/audit — admin audit log viewer.
 *
 * All admin actions are logged with:
 *  - actor id/email
 *  - action
 *  - target type/id
 *  - before/after snapshot
 *  - reason
 *  - ip / user-agent
 *  - created_at
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileSearch, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { getAuditLog, type AdminAuditEntry } from "@/api/admin-tools";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({ meta: [{ title: "Audit log — Admin — DOT" }] }),
  component: AdminAuditPage,
});

type Severity = "low" | "info" | "warning" | "critical";

function actionSeverity(action: string): Severity {
  if (action.includes("ban") || action.includes("demote") || action.includes("impersonate")) return "critical";
  if (action.includes("delete") || action.includes("mint") || action.includes("transfer")) return "warning";
  if (action.includes("update")) return "info";
  return "low";
}

function severityColor(severity: Severity) {
  if (severity === "critical") return "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300";
  if (severity === "warning") return "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300";
  if (severity === "info") return "border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300";
  return "border-border bg-muted/30 text-muted-foreground";
}

function AdminAuditPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-audit", page, q],
    queryFn: () =>
      getAuditLog({
        limit,
        offset: (page - 1) * limit,
        action: q || undefined,
      }),
    staleTime: 15_000,
  });

  const entries: AdminAuditEntry[] = data?.entries ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Append-only record of admin actions. Search + filter.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search action, actor, target, reason…"
              className="min-w-[260px]"
              autoComplete="off"
            />
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <FileSearch className="size-4" />}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="size-4" /> Could not load audit log.
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="w-24">Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const sev = actionSeverity(entry.action);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{entry.actorEmail ?? entry.actorId}</div>
                        <div className="text-muted-foreground">{entry.actorId.slice(0, 8)}…</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {entry.targetType ?? "—"} / {entry.targetId ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs">{entry.reason ?? "—"}</TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">
                        {entry.ip ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px]", severityColor(sev))}>
                          {sev}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {entries.length === 0 && !isLoading && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No log entries found.</div>
          )}

          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <div className="text-xs text-muted-foreground">
              Page {page}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={entries.length < limit || isLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

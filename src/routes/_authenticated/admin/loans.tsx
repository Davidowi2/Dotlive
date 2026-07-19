/**
 * Admin — Loan Applications
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";
import { formatDot } from "@/lib/constants";
import {
  getLoanApplications,
  approveLoanApplication,
  declineLoanApplication,
  requestLoanInfo,
} from "@/api/loan-applications";

export const Route = createFileRoute("/_authenticated/admin/loans")({
  head: () => ({ meta: [{ title: "Admin — Loans — DOT" }] }),
  component: AdminLoansPage,
});

type Review = "pending" | "approved" | "declined" | "more_info_needed" | "all";

function AdminLoansPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const [review, setReview] = useState<Review>("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const q = useQuery({
    queryKey: ["admin-loans", review],
    queryFn: async () => getLoanApplications({ status: review }),
  });

  const applications = q.data?.applications ?? [];

  const approveMut = useMutation({
    mutationFn: (id: string) => approveLoanApplication(id, notes),
    onSuccess: () => {
      toast.success("Application approved");
      qc.invalidateQueries({ queryKey: ["admin-loans"] });
      qc.invalidateQueries({ queryKey: ["loan-applications"] });
      setOpenId(null);
      setNotes("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not approve"),
  });

  const declineMut = useMutation({
    mutationFn: (id: string) => declineLoanApplication(id),
    onSuccess: () => {
      toast.success("Application declined");
      qc.invalidateQueries({ queryKey: ["admin-loans"] });
      qc.invalidateQueries({ queryKey: ["loan-applications"] });
      setOpenId(null);
      setNotes("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not decline"),
  });

  const infoMut = useMutation({
    mutationFn: (id: string) => requestLoanInfo(id, notes),
    onSuccess: () => {
      toast.success("Info request sent");
      qc.invalidateQueries({ queryKey: ["admin-loans"] });
      qc.invalidateQueries({ queryKey: ["loan-applications"] });
      setOpenId(null);
      setNotes("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not request info"),
  });

  const pending = applications.length;

  return (
    <AppShell>
      <PageHeader title="Loan Applications" subtitle="Admin review queue" />

      <Tabs value={review} onValueChange={(v) => setReview(v as Review)} className="mt-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">Pending {pending ? `(${pending})` : ""}</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
          <TabsTrigger value="more_info_needed">More Info</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={review} className="mt-6">
          {q.isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!q.isLoading && pending === 0 && <p className="text-sm text-muted-foreground">No applications in this queue.</p>}

          <div className="mt-4 space-y-3">
            {applications.map((app) => (
              <Card key={app.id} className="rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">{app.legalName}</p>
                      <p className="text-sm text-muted-foreground">{app.ventureName} · {app.countryOfResidence}</p>
                      <p className="text-sm tabular-nums">{formatDot(app.amountRequested)} DOT · {app.repaymentPeriodMonths} months</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setOpenId(openId === app.id ? null : app.id);
                        setNotes("");
                      }}>
                        {openId === app.id ? "Close" : "Review"}
                      </Button>
                    </div>
                  </div>

                  {openId === app.id && (
                    <div className="mt-4 grid gap-4 rounded-xl border border-border bg-muted/40 p-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Phone</p>
                        <p className="text-sm tabular-nums">{app.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">National ID</p>
                        <p className="text-sm tabular-nums">{app.nationalId}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Monthly revenue</p>
                        <p className="text-sm tabular-nums">{formatDot(app.monthlyRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Monthly expenses</p>
                        <p className="text-sm tabular-nums">{formatDot(app.monthlyExpenses)}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Purpose</p>
                        <p className="text-sm text-muted-foreground">{app.purpose}</p>
                      </div>

                      <div className="md:col-span-2 flex flex-col gap-2">
                        <Textarea placeholder="Admin notes / terms" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        <div className="flex gap-2">
                          <Button size="sm" variant="hero" onClick={() => approveMut.mutate(app.id)} disabled={approveMut.isPending}>
                            <CheckCircle2 className="size-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => infoMut.mutate(app.id)} disabled={infoMut.isPending}>
                            <AlertTriangle className="size-4 mr-1" /> Request info
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => declineMut.mutate(app.id)} disabled={declineMut.isPending}>
                            <XCircle className="size-4 mr-1" /> Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

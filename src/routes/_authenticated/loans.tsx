import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { DollarSign, CheckCircle2, XCircle, User } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoanRequests, getLoanRequest, voteOnLoanRequest } from "@/api/loans";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/loans")({
  head: () => ({ meta: [{ title: "Loans — DOT" }] }),
  component: LoansPage,
});

function LoansPage() {
  const [tab, setTab] = useState("open");
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["loan-requests", tab],
    queryFn: () => getLoanRequests(tab === "open" ? "voting" : undefined),
  });

  const requests = requestsData?.requests ?? [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Capital Partner"
        title="Loans"
        subtitle="Browse and vote on loan requests from ventures."
      />

      <Tabs defaultValue={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="open">Open requests</TabsTrigger>
          <TabsTrigger value="all">All requests</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-6">
          <RequestList requests={requests.filter((r) => r.status === "voting")} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <RequestList requests={requests} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function RequestList({ requests, isLoading }: { requests: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }
  if (requests.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <DollarSign className="mx-auto size-10 opacity-50 mb-2" />
        <p>No loan requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <RequestCard key={req.id} request={req} />
      ))}
    </div>
  );
}

function RequestCard({ request }: { request: any }) {
  const qc = useQueryClient();
  const { data: reqDetails, isLoading } = useQuery({
    queryKey: ["loan-request", request.id],
    queryFn: () => getLoanRequest(request.id),
    enabled: false, // only load when expanded
  });
  const [expanded, setExpanded] = useState(false);

  const voteMut = useMutation({
    mutationFn: ({ vote, amount }: { vote: boolean; amount?: number }) =>
      voteOnLoanRequest(request.id, { vote, amountNaira: amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-request", request.id] });
      qc.invalidateQueries({ queryKey: ["loan-requests"] });
      toast.success("Vote recorded!");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not vote"),
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
              <User className="size-5" />
            </div>
            <div>
              <p className="font-medium">{request.ventureName ?? request.founderName ?? "Venture"}</p>
              <p className="text-sm text-muted-foreground">
                ₦{request.amountNaira.toLocaleString()} · {request.termMonths} months
              </p>
            </div>
          </div>
          <Badge variant={request.status === "voting" ? "secondary" : "outline"}>
            {request.status}
          </Badge>
        </div>

        {request.purpose && (
          <p className="text-sm text-muted-foreground mt-3">{request.purpose}</p>
        )}

        <div className="mt-4 flex gap-2 justify-end">
          {request.status === "voting" && (
            <>
              <Button
                variant="outline"
                onClick={() => voteMut.mutate({ vote: false })}
                disabled={voteMut.isPending}
              >
                <XCircle className="size-4 mr-1" />
                Reject
              </Button>
              <Button
                onClick={() => voteMut.mutate({ vote: true, amount: request.amountNaira })}
                disabled={voteMut.isPending}
              >
                <CheckCircle2 className="size-4 mr-1" />
                Approve
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { submitReview } from "@/api/reviews";
import { ReviewModal } from "@/components/work/ReviewModal";
import { toast } from "sonner";
import { useState } from "react";
import { formatDot } from "@/lib/constants";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/work/contract/$id")({
  head: () => ({
    meta: [{ title: "Contract Detail — DOT Work" }],
  }),
  component: ContractDetailPage,
});

function ContractDetailPage() {
  const { id } = Route.useParams();
  const { user } = useDotAuth();
  const [showReview, setShowReview] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Failed to load contract");
      return res.json();
    },
  });

  const isBuilder = order?.builderId === user?.id;
  const isClient = order?.clientId === user?.id;
  const status = order?.status;

  async function handleReviewSubmit(data: { rating: number; comment: string }) {
    await submitReview(id, data);
  }

  if (isLoading) {
    return (
      <AppShell>
        <PageHeader title="Contract" subtitle="Loading contract details…" backHref="/work" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <PageHeader title="Contract" subtitle="Not found" backHref="/work" />
        <div className="mt-6 text-sm text-muted-foreground">This contract does not exist or you do not have access.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={order.title ?? "Contract"}
        subtitle={`ID: ${id}`}
        backHref="/work"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/connect"><MessageSquare className="mr-2 size-4" /> Open thread</Link>
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <StatusBadge status={status} />
            <section>
              <h3 className="font-display text-sm font-medium text-muted-foreground">Description</h3>
              <p className="mt-1 text-sm">{order.description ?? order.requirements ?? "No details provided."}</p>
            </section>

            <section>
              <h3 className="font-display text-sm font-medium text-muted-foreground">Parties</h3>
              <div className="mt-2 grid gap-2 text-sm">
                <div>Buyer: {order.clientId}</div>
                <div>Builder: {order.builderId}</div>
              </div>
            </section>

            <section>
              <h3 className="font-display text-sm font-medium text-muted-foreground">Payment</h3>
              <div className="mt-2 grid gap-1 text-sm tabular">
                <div>Amount: {formatDot(order.amountDot)} DOT</div>
                <div>Escrow: {order.escrowStatus ?? "funded"}</div>
              </div>
            </section>

            <section>
              <h3 className="font-display text-sm font-medium text-muted-foreground">Actions</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {status === "in_progress" && isBuilder && (
                  <Button size="sm" variant="outline">Mark as Delivered</Button>
                )}
                {status === "delivered" && isClient && (
                  <Button size="sm">Approve & Release</Button>
                )}
                {(status === "in_progress" || status === "delivered") && (
                  <Button size="sm" variant="destructive">Dispute</Button>
                )}
                {status === "completed" && (
                  <Button size="sm" onClick={() => setShowReview(true)}>Leave a Review</Button>
                )}
              </div>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="font-display text-sm font-medium text-muted-foreground">Timeline</h3>
            <TimelineItem icon={Clock} label="Created" value={order.createdAt} />
            {order.deliveredAt && <TimelineItem icon={CheckCircle2} label="Delivered" value={order.deliveredAt} />}
            {order.completedAt && <TimelineItem icon={CheckCircle2} label="Completed" value={order.completedAt} />}
            {order.disputedAt && <TimelineItem icon={AlertTriangle} label="Disputed" value={order.disputedAt} />}
          </CardContent>
        </Card>
      </div>

      <ReviewModal open={showReview} onClose={() => setShowReview(false)} onSubmit={handleReviewSubmit} />
    </AppShell>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const meta: Record<string, { label: string; tone: string }> = {
    in_progress: { label: "In progress", tone: "bg-blue-500/10 text-blue-500" },
    delivered: { label: "Delivered", tone: "bg-amber-500/10 text-amber-500" },
    completed: { label: "Completed", tone: "bg-emerald-500/10 text-emerald-500" },
    disputed: { label: "Disputed", tone: "bg-red-500/10 text-red-500" },
    cancelled: { label: "Cancelled", tone: "bg-muted text-muted-foreground" },
  };
  const m = meta[status ?? ""] ?? { label: status ?? "Unknown", tone: "bg-muted text-muted-foreground" };
  return <Badge className={`${m.tone} border-0`}>{m.label}</Badge>;
}

function TimelineItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  const date = new Date(value);
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="size-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">{date.toLocaleString()}</span>
    </div>
  );
}

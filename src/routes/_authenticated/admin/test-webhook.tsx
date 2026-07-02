/**
 * /admin/test-webhook — Fire a mock Whop checkout.completed to verify
 * the full chain end-to-end without a real Whop account.
 *
 *   POST /api/admin/test-webhook
 *     body: { whopProductId?, amountUsdCents?, userId? }
 *
 *   Chain that's exercised:
 *     1) creditWallet → user balance up
 *     2) match course by whopProductId → insert courseEnrollment
 *     3) mintCertificate → "Enrolled: …" cert appears on /certificates
 *
 *   Bypasses HMAC signature check (operator-only).
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Webhook,
  Play,
  Loader2,
  Check,
  AlertCircle,
  ArrowRight,
  Coins,
  BookOpen,
  Award,
} from "lucide-react";
import { AdminShell } from "@/components/app/AdminShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fireTestWebhook, listAdminCourses, type TestWebhookResult } from "@/api/adminAcademy";

export const Route = createFileRoute("/_authenticated/admin/test-webhook")({
  head: () => ({ meta: [{ title: "Test webhook — Admin — DOT" }] }),
  component: AdminTestWebhookPage,
});

function AdminTestWebhookPage() {
  const coursesQ = useQuery({
    queryKey: ["admin-courses"],
    queryFn: listAdminCourses,
  });

  const [whopProductId, setWhopProductId] = useState("");
  const [amountUsdCents, setAmountUsdCents] = useState(1000);
  const [result, setResult] = useState<TestWebhookResult | null>(null);
  const fire = useMutation({
    mutationFn: () =>
      fireTestWebhook({
        whopProductId: whopProductId.trim() || null,
        amountUsdCents: Number(amountUsdCents) || 1000,
      }),
    onSuccess: (r) => {
      setResult(r);
      toast.success("Test webhook fired");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <AdminShell role="Operator">
      <PageHeader
        eyebrow="Verify"
        title="Test Whop webhook"
        subtitle="Fire a mock checkout.completed through the real chain. No real money, no Whop account required."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display text-base font-semibold">Payload</h2>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                Whop product ID (optional)
              </label>
              <Input
                value={whopProductId}
                onChange={(e) => setWhopProductId(e.target.value)}
                placeholder="prod_xxxxxxxxxxxx"
                className="font-mono"
              />
              {coursesQ.data && coursesQ.data.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Pick from your published courses
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {coursesQ.data
                      .filter((c) => c.whopProductId)
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setWhopProductId(c.whopProductId ?? "")}
                          className="rounded-md border border-border bg-muted/30 px-2 py-1 text-xs hover:border-primary/40"
                        >
                          {c.title} · <span className="font-mono">{c.whopProductId?.slice(0, 10)}…</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
                Amount in USD cents
              </label>
              <Input
                type="number"
                min={1}
                value={amountUsdCents}
                onChange={(e) => setAmountUsdCents(Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                = {Math.floor((Number(amountUsdCents) || 0) / 10)} DOT credited
              </p>
            </div>

            <Button
              className="w-full"
              disabled={fire.isPending}
              onClick={() => fire.mutate()}
            >
              {fire.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Fire test checkout
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-base font-semibold">Result</h2>
            {!result && (
              <p className="mt-3 text-sm text-muted-foreground">
                Fire the test to see what happens.
              </p>
            )}
            {result && (
              <div className="mt-3 space-y-3">
                <Step
                  icon={Coins}
                  ok
                  label="Wallet credited"
                  detail={`${result.credited.dot} DOT → user ${result.credited.userId.slice(0, 8)}…`}
                />
                <Step
                  icon={BookOpen}
                  ok={!!result.enrollment}
                  label="Course enrollment"
                  detail={
                    result.enrollment
                      ? `Enrolled in "${result.enrollment.courseTitle}"`
                      : "No matching course for that whopProductId"
                  }
                />
                <Step
                  icon={Award}
                  ok={!!result.enrollment}
                  label="Certificate minted"
                  detail={
                    result.enrollment
                      ? `Visit /certificates to see "Enrolled: ${result.enrollment.courseTitle}"`
                      : "Skipped (no course match)"
                  }
                />
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href="/wallet">
                      Check wallet <ArrowRight className="size-3.5" />
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href="/certificates">
                      Check certificates <ArrowRight className="size-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function Step({
  icon: Icon,
  ok,
  label,
  detail,
}: {
  icon: typeof Check;
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
      <span
        className={
          ok
            ? "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
            : "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
        }
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{label}</p>
          {ok ? (
            <Badge variant="default">OK</Badge>
          ) : (
            <Badge variant="secondary">Skipped</Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

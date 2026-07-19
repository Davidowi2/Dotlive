/**
 * /admin/test-webhook — generic webhook tester for any provider.
 *
 * Form: provider, event type, payload body.
 * Action: Send test → POST /api/admin/test-webhook/generic
 * Result: status, body, latency, headers summary.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Play, Loader2, Check, AlertCircle, Clock,
  ShieldCheck, ExternalLink, RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { fireTestWebhook } from "@/api/adminAcademy";
import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/admin/test-webhook")({
  head: () => ({ meta: [{ title: "Test webhook — Admin — DOT" }] }),
  component: AdminTestWebhookPage,
});

type TestResult = {
  ok: boolean;
  provider: string;
  eventType: string;
  status: number;
  latencyMs: number;
  body: string;
  headers: Record<string, string>;
};

function AdminTestWebhookPage() {
  const qc = useQueryClient();

  const [provider, setProvider] = useState("paystack");
  const [eventType, setEventType] = useState("charge.success");
  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        event: "charge.success",
        data: {
          reference: "test-ref-001",
          amount: 500000,
          status: "success",
          paid_at: new Date().toISOString(),
        },
      },
      null,
      2,
    ),
  );

  const fire = useMutation({
    mutationFn: async () => {
      const start = performance.now();
      const res = await dotApi.post<{ ok: boolean; echo?: any }>("/api/admin/test-webhook/generic", {
        provider: provider.trim() || null,
        eventType: eventType.trim() || null,
        payload: payload.trim() || null,
      });
      const latencyMs = Math.round(performance.now() - start);
      return {
        ok: !!res,
        provider: provider.trim(),
        eventType: eventType.trim() || "custom",
        status: res?.status ?? 200,
        latencyMs,
        body: typeof res === "string" ? res : JSON.stringify(res, null, 2),
        headers: res?.headers ?? {},
      } as TestResult;
    },
    onSuccess: () => toast.success("Test webhook sent"),
    onError: (e: any) => toast.error(e?.message ?? "Test webhook failed"),
  });

  const [result, setResult] = useState<TestResult | null>(null);

  return (
    <div>
      <PageHeader
        eyebrow="Verify"
        title="Test webhook"
        subtitle="Send a synthetic webhook payload through any provider ingest path and inspect the response."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display text-base font-semibold">Payload</h2>

            <div className="space-y-2">
              <Label>Provider</Label>
              <Input
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="paystack | whop | custom"
              />
            </div>

            <div className="space-y-2">
              <Label>Event type</Label>
              <Input
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="charge.success | checkout.completed | ..."
              />
            </div>

            <div className="space-y-2">
              <Label>JSON payload</Label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="h-64 w-full rounded-md border border-border bg-muted/30 p-3 font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="w-full"
                disabled={fire.isPending}
                onClick={async () => {
                  const r = await fire.mutateAsync();
                  setResult(r);
                }}
              >
                {fire.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Send test
              </Button>
              <Button
                variant="outline"
                disabled={fire.isPending}
                onClick={() => {
                  setProvider("paystack");
                  setEventType("charge.success");
                  setPayload(
                    JSON.stringify(
                      { event: "charge.success", data: { reference: "test-ref-001", amount: 500000, status: "success", paid_at: new Date().toISOString() } },
                      null,
                      2,
                    ),
                  );
                  setResult(null);
                }}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-base font-semibold">Response</h2>
            {!result && (
              <p className="mt-3 text-sm text-muted-foreground">Fire a test event to see provider response.</p>
            )}
            {result && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={result.ok ? "default" : "destructive"}>
                    {result.ok ? <Check className="size-3" /> : <AlertCircle className="size-3" />}
                    {result.status}
                  </Badge>
                  <Badge variant="secondary">
                    <Clock className="size-3" /> {result.latencyMs} ms
                  </Badge>
                  <Badge variant="secondary">{result.provider}</Badge>
                  <Badge variant="secondary">{result.eventType}</Badge>
                </div>

                <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px]">
                  {result.body}
                </pre>

                {Object.keys(result.headers).length > 0 && (
                  <details className="rounded-lg border border-border">
                    <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">
                      Headers
                    </summary>
                    <pre className="max-h-48 overflow-auto bg-muted/20 px-3 py-2 font-mono text-[10px]">
                      {JSON.stringify(result.headers, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

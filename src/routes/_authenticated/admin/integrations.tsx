/**
 * /admin/integrations — integration health + config.
 *
 * Cards per provider:
 *  - Paystack
 *  - Whop
 *  - Cloudinary
 *  - Resend
 *
 * Each card shows: name, status, last sync, config preview, test/reconnect actions.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw, CheckCircle2, AlertTriangle, Eye, EyeOff, Loader2,
  ShieldCheck, ExternalLink, Save, Server,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { dotApi } from "@/api/client";

type IntegrationHealth = {
  provider: string;
  name: string;
  description: string;
  status: "ok" | "degraded" | "down" | "unknown";
  lastSync: string | null;
  configPreview: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Admin — DOT" }] }),
  component: AdminIntegrationsPage,
});

function AdminIntegrationsPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-integrations-health"],
    queryFn: async () => {
      const res = await dotApi.get<{ paystack: any; whop: any; cloudinary: any; resend: any }>("/api/admin/integrations/status");
      const map = (provider: string, name: string, description: string) => {
        const raw = (res as any)[provider] ?? {};
        return {
          provider,
          name,
          description,
          status: raw.status ?? "unknown",
          lastSync: raw.lastSync ?? null,
          configPreview: raw.configured ? "configured" : null,
        } satisfies IntegrationHealth;
      };
      return [
        map("paystack", "Paystack", "Naira deposits → DOT credit"),
        map("whop", "Whop", "Academy/webhook provider"),
        map("cloudinary", "Cloudinary", "Media uploads"),
        map("resend", "Resend", "Transactional email"),
      ];
    },
    staleTime: 15_000,
  });

  const providers: IntegrationHealth[] = data ?? [];
  const testMut = useMutation({
    mutationFn: async (provider: string) =>
      dotApi.post(`/api/admin/integrations/${provider}/test`, {}),
    onSuccess: (res, provider) => {
      toast.success(`${provider} test succeeded`);
      refetch();
    },
    onError: (e: any, _vars: string) => toast.error(e?.message ?? "Test failed"),
  });

  const reconnectMut = useMutation({
    mutationFn: async (provider: string) =>
      dotApi.post(`/api/admin/integrations/${provider}/reconnect`, {}),
    onSuccess: (_, provider) => {
      toast.success(`${provider} reconnect initiated`);
      refetch();
    },
    onError: (e: any, _vars: string) => toast.error(e?.message ?? "Reconnect failed"),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Ops"
        title="Integrations"
        subtitle="Provider health, config previews, test and reconnect actions."
        action={
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {isError && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Could not load integration health.
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {providers.map((p) => (
          <ProviderCard
            key={p.provider}
            provider={p}
            onTest={() => testMut.mutate(p.provider)}
            onReconnect={() => reconnectMut.mutate(p.provider)}
            testing={testMut.isPending}
            reconnecting={reconnectMut.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function ProviderCard({
  provider,
  onTest,
  onReconnect,
  testing,
  reconnecting,
}: {
  provider: IntegrationHealth;
  onTest: () => void;
  onReconnect: () => void;
  testing: boolean;
  reconnecting: boolean;
}) {
  const [showConfig, setShowConfig] = useState(false);

  const accent =
    provider.status === "ok"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : provider.status === "degraded"
      ? "border-amber-500/30 bg-amber-500/5"
      : provider.status === "down"
      ? "border-red-500/30 bg-red-500/5"
      : "border-border";

  return (
    <Card className={`rounded-2xl border ${accent}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Server className="size-4" />
            </span>
            <div>
              <CardTitle className="text-sm font-semibold">{provider.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{provider.description}</p>
            </div>
          </div>
          <StatusBadge status={provider.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Last sync: {provider.lastSync ? new Date(provider.lastSync).toLocaleString() : "Never"}</span>
        </div>

        {provider.configPreview && (
          <div className="mt-3 rounded-lg border border-border bg-muted/30 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Config preview</span>
              <button
                type="button"
                onClick={() => setShowConfig((v) => !v)}
                className="text-[10px] text-primary hover:underline"
              >
                {showConfig ? "Hide" : "Show"}
              </button>
            </div>
            {showConfig && (
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted/50 px-2 py-2 text-[11px] font-mono">
                {provider.configPreview}
              </pre>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onTest} disabled={testing}>
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
            Test
          </Button>
          <Button size="sm" variant="outline" onClick={onReconnect} disabled={reconnecting}>
            {reconnecting ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Reconnect
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href="/admin/test-webhook">
              External <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: IntegrationHealth["status"] }) {
  if (status === "ok") {
    return (
      <Badge variant="default" className="gap-1 text-[10px]">
        <CheckCircle2 className="size-3" /> Operational
      </Badge>
    );
  }
  if (status === "down") {
    return (
      <Badge variant="destructive" className="gap-1 text-[10px]">
        <AlertTriangle className="size-3" /> Down
      </Badge>
    );
  }
  if (status === "degraded") {
    return (
      <Badge className="gap-1 border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">
        <AlertTriangle className="size-3" /> Degraded
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-[10px]">
      <Server className="size-3" /> Unknown
    </Badge>
  );
}

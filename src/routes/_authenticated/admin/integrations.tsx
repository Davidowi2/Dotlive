/**
 * /admin/integrations — Save the Whop API key + webhook secret.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound, Save, Eye, EyeOff, Loader2,
  ShieldCheck, RefreshCw, Check, Package, AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getIntegrations, setIntegration } from "@/api/adminAcademy";
import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/admin/integrations")({
  head: () => ({ meta: [{ title: "Integrations — Admin — DOT" }] }),
  component: AdminIntegrationsPage,
});

function AdminIntegrationsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: getIntegrations,
    retry: 1,
  });

  const isErr = q.isError || (q.data === undefined && !q.isLoading);

  return (
    <div>
      <PageHeader
        eyebrow="Whop"
        title="Integrations"
        subtitle="Save your Whop API key and webhook signing secret."
      />

      {/* Error banner */}
      {isErr && !q.isLoading && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>Could not load integration status — the table may not exist yet on this server. Save a value to create it.</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <IntegrationCard
          title="Whop API key"
          description="Required to pull product lists from Whop. Get it at whop.com → Settings → API."
          preview={q.data?.whop_api_key}
          loading={q.isLoading}
          onSave={async (val) => {
            await setIntegration("whop_api_key", val);
            toast.success("Whop API key saved");
            qc.invalidateQueries({ queryKey: ["admin-integrations"] });
          }}
          placeholder="whop_xxxxxxxxxxxxxxxxxxxxxxxx"
          fieldName="whop-api-key"
        />
        <IntegrationCard
          title="Whop webhook signing secret"
          description="Generated when you create a webhook in Whop → /api/webhooks/whop. Verifies HMAC-SHA256."
          preview={q.data?.whop_webhook_secret}
          loading={q.isLoading}
          onSave={async (val) => {
            await setIntegration("whop_webhook_secret", val);
            toast.success("Webhook secret saved");
            qc.invalidateQueries({ queryKey: ["admin-integrations"] });
          }}
          placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
          fieldName="whop-webhook-secret"
        />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </span>
          <div className="text-sm">
            <h2 className="font-display text-base font-semibold mb-2">How to wire Whop → DOT</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
              <li>Go to <a href="https://whop.com/dashboard" target="_blank" rel="noreferrer" className="text-primary hover:underline">whop.com/dashboard</a> → Settings → API → copy your API key → paste above</li>
              <li>Create a webhook in Whop → Settings → Webhooks → endpoint:
                <code className="block mt-1 rounded bg-muted px-2 py-1 text-xs">https://dotlive-api.onrender.com/api/webhooks/whop</code>
              </li>
              <li>Subscribe to <code className="rounded bg-muted px-1 py-0.5">checkout.completed</code> events → copy signing secret → paste above</li>
              <li>Click <strong>Sync from Whop</strong> below to auto-import your products as courses</li>
              <li>Test end-to-end at <a href="/admin/test-webhook" className="text-primary hover:underline">/admin/test-webhook</a></li>
            </ol>
          </div>
        </div>
      </section>

      <SyncFromWhop />
    </div>
  );
}

function IntegrationCard({
  title,
  description,
  preview,
  loading,
  onSave,
  placeholder,
  fieldName,
}: {
  title: string;
  description: string;
  preview?: { set: boolean; preview: string; updatedAt: string | null } | null;
  loading: boolean;
  onSave: (value: string) => Promise<void>;
  placeholder: string;
  fieldName: string;
}) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSet = preview?.set === true;
  const previewText = isSet ? (preview?.preview ?? "") : "";
  const updatedAt = isSet && preview?.updatedAt
    ? new Date(preview.updatedAt).toLocaleDateString()
    : null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setSaving(true);
    try {
      await onSave(value.trim());
      setValue("");
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : isSet ? (
          <Badge variant="default">Set</Badge>
        ) : (
          <Badge variant="secondary">Not set</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>

      {isSet && (
        <div className="mt-2 rounded-md border border-border bg-muted/30 px-2 py-1 text-[10px] font-mono text-muted-foreground">
          {previewText}{updatedAt ? ` · updated ${updatedAt}` : ""}
        </div>
      )}

      {/* Wrap in form to satisfy browser accessibility and fix DOM warning */}
      <form id={`integration-form-${fieldName}`} onSubmit={handleSave} className="mt-3 space-y-2">
        {/* Hidden username field satisfies browser password manager expectations */}
        <input type="text" name="username" autoComplete="username" className="hidden" readOnly value="dotlive-operator" aria-hidden="true" tabIndex={-1} />
        <div className="relative">
          <Input
            id={fieldName}
            name={fieldName}
            type={show ? "text" : "password"}
            autoComplete={show ? "off" : "new-password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="pr-10 font-mono text-xs"
            aria-label={title}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide" : "Show"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={saving || !value.trim()}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isSet ? "Update" : "Save"}
        </Button>
      </form>
    </div>
  );
}

function SyncFromWhop() {
  const qc = useQueryClient();
  const [result, setResult] = useState<{ created: number; skipped: number; products: any[] } | null>(null);

  const syncMut = useMutation({
    mutationFn: async () =>
      dotApi.post<{ created: number; skipped: number; products: any[] }>(
        "/api/admin/integrations/sync-whop", {}
      ),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["academy-courses"] });
      toast.success(`Synced — ${data.created} new, ${data.skipped} already existed`);
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Sync failed — check your Whop API key");
    },
  });

  return (
    <section className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="size-4 text-primary" />
            <h2 className="font-display text-base font-semibold">Sync from Whop</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Pull all your Whop products and create them as courses in DOT Academy.
            Products already imported are skipped.
          </p>
        </div>
        <Button onClick={() => syncMut.mutate()} disabled={syncMut.isPending} variant="hero">
          {syncMut.isPending
            ? <><Loader2 className="size-4 animate-spin" /> Syncing…</>
            : <><RefreshCw className="size-4" /> Sync now</>}
        </Button>
      </div>

      {result && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-primary font-medium">
              <Check className="size-3.5" /> {result.created} imported
            </span>
            <span className="text-muted-foreground">{result.skipped} already existed</span>
          </div>
          {result.products.length > 0 && (
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {result.products.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <Package className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.id}</p>
                  </div>
                  <Badge variant={p.isNew ? "default" : "secondary"}>
                    {p.isNew ? "Imported" : "Skipped"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

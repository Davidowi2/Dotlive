/**
 * /admin/integrations — Save the Whop API key + webhook secret.
 *
 * Values are stored server-side in the `integration_secrets` table. We
 * never display them after save; only a `whop_****…ab` preview.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Save, Eye, EyeOff, Loader2, ExternalLink, ShieldCheck, RefreshCw, Check, Package } from "lucide-react";
import { AdminShell } from "@/components/app/AdminShell";
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
  });
  return (
    <AdminShell role="Operator">
      <PageHeader
        eyebrow="Whop"
        title="Integrations"
        subtitle="Save your Whop API key and webhook signing secret. DOT will use them to verify webhooks + import products."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <IntegrationCard
          title="Whop API key"
          description="Required if you want DOT to pull product lists from Whop. Get it at whop.com → Settings → API."
          preview={q.data?.whop_api_key}
          loading={q.isLoading}
          onSave={async (val) => {
            await setIntegration("whop_api_key", val);
            toast.success("Whop API key saved");
            qc.invalidateQueries({ queryKey: ["admin-integrations"] });
          }}
          placeholder="whop_xxxxxxxxxxxxxxxxxxxxxxxx"
        />
        <IntegrationCard
          title="Whop webhook signing secret"
          description="Generated when you create a webhook in Whop pointing at /api/webhooks/whop. Used to verify the HMAC-SHA256 signature on incoming events."
          preview={q.data?.whop_webhook_secret}
          loading={q.isLoading}
          onSave={async (val) => {
            await setIntegration("whop_webhook_secret", val);
            toast.success("Webhook secret saved");
            qc.invalidateQueries({ queryKey: ["admin-integrations"] });
          }}
          placeholder="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
        />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold">How to wire Whop → DOT</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Create a company in <a href="https://whop.com/dashboard" target="_blank" rel="noreferrer" className="text-primary hover:underline">whop.com/dashboard</a> (or pick an existing one).
              </li>
              <li>Add a product with a Whop checkout URL. Copy the product's <code className="rounded bg-muted px-1 py-0.5">prod_…</code> ID.</li>
              <li>Go to <strong>Settings → Webhooks</strong> and create a new webhook pointing at:</li>
              <li>
                <code className="block rounded bg-muted px-2 py-1 text-xs">https://dotlive-api.onrender.com/api/webhooks/whop</code>
              </li>
              <li>Subscribe to <code className="rounded bg-muted px-1 py-0.5">checkout.completed</code> events.</li>
              <li>Copy the <strong>signing secret</strong> Whop gives you → paste it above.</li>
              <li>Add your <code className="rounded bg-muted px-1 py-0.5">prod_…</code> ID to a course via <a href="/admin/courses" className="text-primary hover:underline">/admin/courses</a>.</li>
              <li>Or click <strong>"Sync from Whop"</strong> below to auto-import all your products as courses.</li>
              <li>Test the chain with <a href="/admin/test-webhook" className="text-primary hover:underline">/admin/test-webhook</a> before going live.</li>
            </ol>
          </div>
        </div>
      </section>

      <SyncFromWhop />
    </AdminShell>
  );
}

function IntegrationCard({
  title,
  description,
  preview,
  loading,
  onSave,
  placeholder,
}: {
  title: string;
  description: string;
  preview?: { set: boolean; preview: string; updatedAt: string | null };
  loading: boolean;
  onSave: (value: string) => Promise<void>;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : preview?.set ? (
          <Badge variant="default">Set</Badge>
        ) : (
          <Badge variant="secondary">Not set</Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>

      {preview?.set && (
        <div className="mt-2 rounded-md border border-border bg-muted/30 px-2 py-1 text-[10px] font-mono text-muted-foreground">
          current: {preview.preview} · updated {new Date(preview.updatedAt!).toLocaleString()}
        </div>
      )}

      <div className="relative mt-3">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pr-10 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <Button
        size="sm"
        className="mt-3 w-full"
        disabled={saving || !value.trim()}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave(value.trim());
            setValue("");
          } catch (e: any) {
            toast.error(e?.message ?? "Save failed");
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {preview?.set ? "Update" : "Save"}
      </Button>
    </div>
  );
}

/* ─── Sync from Whop ─────────────────────────────────────────── */
function SyncFromWhop() {
  const qc = useQueryClient();
  const [result, setResult] = useState<{ created: number; skipped: number; products: any[] } | null>(null);

  const syncMut = useMutation({
    mutationFn: async () => {
      const r = await dotApi.post<{ created: number; skipped: number; products: any[] }>(
        "/api/admin/integrations/sync-whop", {}
      );
      return r;
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      qc.invalidateQueries({ queryKey: ["academy-courses"] });
      toast.success(`Synced from Whop — ${data.created} new, ${data.skipped} already existed`);
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
            Pull all your Whop products and automatically create them as courses in DOT Academy.
            Products already imported are skipped (no duplicates).
          </p>
        </div>
        <Button
          onClick={() => syncMut.mutate()}
          disabled={syncMut.isPending}
          variant="hero"
        >
          {syncMut.isPending
            ? <><Loader2 className="size-4 animate-spin" /> Syncing…</>
            : <><RefreshCw className="size-4" /> Sync now</>
          }
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

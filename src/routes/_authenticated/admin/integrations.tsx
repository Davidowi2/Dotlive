/**
 * /admin/integrations — Save the Whop API key + webhook secret.
 *
 * Values are stored server-side in the `integration_secrets` table. We
 * never display them after save; only a `whop_****…ab` preview.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Save, Eye, EyeOff, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/app/AdminShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getIntegrations, setIntegration } from "@/api/adminAcademy";

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
              <li>Test the chain with <a href="/admin/test-webhook" className="text-primary hover:underline">/admin/test-webhook</a> before going live.</li>
            </ol>
          </div>
        </div>
      </section>
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

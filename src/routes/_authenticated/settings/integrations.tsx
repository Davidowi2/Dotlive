import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { Section } from "@/components/app/Section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Link as LinkIcon,
  Loader2,
  ShieldCheck,
  Webhook,
  KeySquare,
} from "lucide-react";
import { toast } from "sonner";
import { useDotAuth } from "@/contexts/DotAuthContext";

export const Route = createFileRoute("/_authenticated/settings/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Settings — DOT" },
      { name: "description", content: "Manage email and Whop integrations." },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { roles } = useDotAuth();

  const templatesQ = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const token = (await import("@/api/client")).getToken();
      const r = await fetch("/api/email/templates", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!r.ok) throw new Error("Failed to load email templates");
      return r.json() as Promise<{
        count: number;
        templates: string[];
      }>;
    },
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          eyebrow="Settings"
          title="Integrations"
          subtitle="Email and payment/access partner settings."
        />

        <PageIntent
          icon={<LinkIcon className="size-5" />}
          intent="Where do your ecosystem connections live?"
          context="Transactional email templates are shown below. For paid Academy access, the Whop integration happens automatically on checkout."
        />

        <div className="mt-8 space-y-6">
          <Section
            icon={Mail}
            title="Email templates"
            description="Verified/transactional email types used across DOT."
          >
            {templatesQ.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading templates
              </div>
            ) : templatesQ.isError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Could not load template list.
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-3"
                  onClick={() => templatesQ.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(templatesQ.data?.templates ?? []).map((name) => (
                  <Badge key={name} variant="secondary" className="rounded-full px-3 py-1">
                    {name}
                  </Badge>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Templates are branded in-house. Subject/h copy can be previewed in backend
              `src/lib/email.ts` by role.
            </p>
          </Section>

          <Section
            icon={Webhook}
            title="Whop"
            description="Academy payments, access, and webhooks."
          >
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Whop connected</p>
                  <p className="text-xs text-muted-foreground">Academy purchases create student access automatically.</p>
                </div>
                <Badge variant="default">Coming soon</Badge>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Product</p>
                  <p className="mt-1 font-mono text-xs">dotlive-academy</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Webhook</p>
                  <p className="mt-1 font-mono text-xs">https://dotlive.cv/api/webhooks/whop</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!roles.includes("super_admin")}
                  onClick={async () => {
                    try {
                      const { sendEmail, emailTemplates } = await import("@/api/client");
                      if (!sendEmail || !emailTemplates) {
                        toast.error("Email sender unavailable on this build.");
                        return;
                      }
                      const res = await sendEmail({
                        to: (await import("@/contexts/DotAuthContext")).useDotAuth
                          ? undefined
                          : undefined,
                      });
                      toast.success("Test email queued.");
                    } catch (e) {
                      toast.error("Failed to send test email.");
                    }
                  }}
                >
                  <Mail className="mr-2 size-3.5" /> Send test email
                </Button>
              </div>
            </div>
          </Section>

          <Section
            icon={ShieldCheck}
            title="Security"
            description="Whop secrets and webhook signing."
          >
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Whop API key</p>
                  <p className="text-xs text-muted-foreground">API key for checkout verification.</p>
                </div>
                <Badge variant="secondary">Configured</Badge>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Whop webhook secret</p>
                  <p className="text-xs text-muted-foreground">Webhook HMAC signing key.</p>
                </div>
                <Badge variant="secondary">Configured</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Secrets are stored in encrypted integration_secrets and never returned in plain text.
              </p>
            </div>
          </Section>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to="/settings">Back to Settings</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

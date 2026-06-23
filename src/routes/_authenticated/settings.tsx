import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Shield, Palette, Globe, Trash2, LogOut, Mail } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { dotApi } from "@/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — DOT" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, logout } = useDotAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    logout();
    navigate({ to: "/auth" });
  }

  async function handlePasswordReset() {
    if (!user?.email) return;
    try {
      await dotApi.post("/api/auth/forgot-password", { email: user.email });
      toast.success("Password reset link sent to your email.");
    } catch {
      toast.error("Could not send reset link. Try again.");
    }
  }
  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Manage your account preferences." />

      <div className="mt-8 max-w-2xl space-y-6">
        <Section icon={Bell} title="Notifications">
          <Row label="Meeting requests" sub="Get notified when an investor requests a meeting">
            <Switch defaultChecked />
          </Row>
          <Row label="Vantage updates" sub="Score changes and assessment reminders">
            <Switch defaultChecked />
          </Row>
          <Row label="Wallet activity" sub="Deposits, transfers, and rewards">
            <Switch defaultChecked />
          </Row>
          <Row label="Community activity" sub="New members and milestones">
            <Switch />
          </Row>
        </Section>

        <Section icon={Palette} title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </Section>

        <Section icon={Shield} title="Security">
          <Row label="Change password" sub="Send a password reset link to your email">
            <Button variant="outline" size="sm" onClick={handlePasswordReset}>
              <Mail className="size-4" /> Send reset link
            </Button>
          </Row>
          <Row label="Two-factor authentication" sub="Extra security for your account">
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </Row>
        </Section>

        <Section icon={Globe} title="Account">
          <Row label="Language" sub="English (UK)"><span className="text-sm text-muted-foreground">English</span></Row>
          <Row label="Currency display" sub="Naira (₦)"><span className="text-sm text-muted-foreground">NGN</span></Row>
        </Section>

        <Separator />

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
          <Button variant="outline" className="w-full justify-start text-destructive hover:bg-destructive/10">
            <Trash2 className="size-4" /> Delete account — contact support@dot.africa
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Bell; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="size-4 text-primary" />
        <h2 className="font-display text-base font-semibold">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {children}
    </div>
  );
}

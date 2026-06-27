import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Shield,
  Palette,
  Globe,
  Trash2,
  LogOut,
  Mail,
  Sun,
  Moon,
  User as UserIcon,
  Check,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { dotApi } from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — DOT" }] }),
  component: SettingsPage,
});

/* ─── Reusable row + section primitives (Option A tokens) ───── */
function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-border pb-4">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function SettingsRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingsPage() {
  const { user, logout } = useDotAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("account");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  async function toggle2FA(checked: boolean) {
    try {
      await dotApi.post(`/api/users/me/2fa/${checked ? "enable" : "disable"}`, {});
      setTwoFAEnabled(checked);
      toast.success(checked ? "2FA enabled" : "2FA disabled");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update 2FA");
    }
  }

  function handleSignOut() {
    logout();
    navigate({ to: "/auth", search: { mode: "signin" } });
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
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your profile, security, and how DOT looks for you."
      />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="account">
            <UserIcon className="size-3.5" /> Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="size-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="size-3.5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="size-3.5" /> Security
          </TabsTrigger>
        </TabsList>

        {/* ─── Account ──────────────────────────────────────── */}
        <TabsContent value="account" className="space-y-6">
          <SettingsSection
            icon={UserIcon}
            title="Profile"
            description="Your public profile is visible to investors and community members."
          >
            <SettingsRow
              label="Display name"
              sub="Shown on your profile and across the platform"
            >
              <span className="text-sm text-muted-foreground">
                {user?.name ?? "—"}
              </span>
            </SettingsRow>
            <SettingsRow label="Email" sub="Used for sign-in and notifications">
              <span className="font-mono text-sm text-muted-foreground">
                {user?.email ?? "—"}
              </span>
            </SettingsRow>
            <SettingsRow
              label="DOT ID"
              sub="Your permanent identifier — share to receive transfers"
            >
              <span className="font-mono text-sm text-muted-foreground">
                {user?.dotId ?? "—"}
              </span>
            </SettingsRow>
            <div className="pt-2">
              <Button asChild variant="outline" size="sm">
                <a href="/profile">View public profile</a>
              </Button>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Globe}
            title="Region & currency"
            description="How money and dates are displayed across DOT."
          >
            <SettingsRow label="Language" sub="Interface and notifications">
              <span className="text-sm text-muted-foreground">English (UK)</span>
            </SettingsRow>
            <SettingsRow label="Currency display" sub="Used for wallet and deal values">
              <span className="text-sm text-muted-foreground">NGN — ₦</span>
            </SettingsRow>
            <SettingsRow label="Timezone" sub="Affects session times and logs">
              <span className="text-sm text-muted-foreground">
                West Africa Time (UTC+1)
              </span>
            </SettingsRow>
          </SettingsSection>
        </TabsContent>

        {/* ─── Notifications ───────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-6">
          <SettingsSection
            icon={Bell}
            title="Email & push"
            description="Choose which platform activity reaches your inbox."
          >
            <SettingsRow
              label="Meeting requests"
              sub="When an investor requests a meeting"
            >
              <Switch defaultChecked />
            </SettingsRow>
            <SettingsRow
              label="Vantage updates"
              sub="Score changes and assessment reminders"
            >
              <Switch defaultChecked />
            </SettingsRow>
            <SettingsRow
              label="Wallet activity"
              sub="Deposits, transfers, and DOT rewards"
            >
              <Switch defaultChecked />
            </SettingsRow>
            <SettingsRow
              label="Community activity"
              sub="New members and milestones"
            >
              <Switch />
            </SettingsRow>
            <SettingsRow
              label="Academy reminders"
              sub="Course deadlines and new content"
            >
              <Switch defaultChecked />
            </SettingsRow>
          </SettingsSection>
        </TabsContent>

        {/* ─── Appearance ──────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-6">
          <SettingsSection
            icon={Palette}
            title="Theme"
            description="Switch between light and dark. The cream paper and deep forest are the editorial defaults."
          >
            <SettingsRow
              label="Theme"
              sub="Light, dark, or follow your system"
            >
              <ThemeToggle />
            </SettingsRow>
            <SettingsRow
              label="Preview"
              sub="How the current theme renders in-app"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border border-border",
                    "bg-[oklch(0.96_0.02_90)] text-foreground",
                  )}
                  aria-label="Light preview"
                >
                  <Sun className="size-4" />
                </span>
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border border-border",
                    "bg-[oklch(0.14_0.02_155)] text-primary",
                  )}
                  aria-label="Dark preview"
                >
                  <Moon className="size-4" />
                </span>
              </div>
            </SettingsRow>
          </SettingsSection>
        </TabsContent>

        {/* ─── Security ────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6">
          <SettingsSection
            icon={Shield}
            title="Authentication"
            description="Keep your wallet and account safe."
          >
            <SettingsRow
              label="Change password"
              sub="Send a password reset link to your email"
            >
              <Button variant="outline" size="sm" onClick={handlePasswordReset}>
                <Mail className="size-4" /> Send reset link
              </Button>
            </SettingsRow>
            <SettingsRow
              label="Two-factor authentication"
              sub="Require a second factor on sign-in"
            >
              <Switch id="twofa" checked={twoFAEnabled} onCheckedChange={toggle2FA} />
            </SettingsRow>
            <SettingsRow
              label="Active sessions"
              sub="Devices currently signed in to your account"
            >
              <Button asChild variant="ghost" size="sm">
                <a href="/settings">
                  <Check className="size-4" /> Review
                </a>
              </Button>
            </SettingsRow>
          </SettingsSection>

          <Separator />

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" /> Sign out of this device
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" /> Request account deletion — contact support@dot.africa
            </Button>
            <p className="pt-1 text-xs text-muted-foreground">
              Account deletion is permanent. All DOT balances, certifications, and
              history will be removed within 30 days.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

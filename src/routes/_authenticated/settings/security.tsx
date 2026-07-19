/**
 * Settings → Security
 *
 * - 2FA setup/verify/disable
 * - backup codes
 * - admin enforcement notice
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Loader2, Check, AlertCircle, X, Copy,
  QrCode, Lock, Unlock,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { dotApi } from "@/api/client";

export const Route = createFileRoute("/_authenticated/settings/security")({
  head: () => ({ meta: [{ title: "Security settings — DOT" }] }),
  component: SecurityPage,
});

type SetupResult = {
  secret: string;
  qrUrl: string;
  backupCodes: string[];
};

type MeUser = {
  id: string;
  email: string;
  twoFactorEnabled?: boolean;
};

function SecurityPage() {
  const qc = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await dotApi.get<{ user: MeUser }>("/api/auth/me")).user,
    staleTime: 30_000,
  });

  const [setup, setSetup] = useState<SetupResult | null>(null);
  const [code, setCode] = useState("");
  const [disablePwd, setDisablePwd] = useState("");

  const setupMut = useMutation({
    mutationFn: async () => {
      const res = await dotApi.post<SetupResult>("/api/auth/2fa/setup", {});
      setSetup(res);
      return res;
    },
    onSuccess: () => toast.success("2FA initialized"),
    onError: (e: any) => toast.error(e?.message ?? "Setup failed"),
  });

  const verifyMut = useMutation({
    mutationFn: async () => {
      await dotApi.post("/api/auth/2fa/verify", { code: code.trim() });
      setSetup(null);
      setCode("");
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("2FA enabled");
    },
    onError: (e: any) => toast.error(e?.message ?? "Verification failed"),
  });

  const disableMut = useMutation({
    mutationFn: async () => {
      await dotApi.post("/api/auth/2fa/disable", { password: disablePwd });
      setDisablePwd("");
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("2FA disabled");
    },
    onError: (e: any) => toast.error(e?.message ?? "Disable failed"),
  });

  const enabled = !!me?.twoFactorEnabled;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Two-factor authentication and account protection.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {enabled ? (
              <><Lock className="size-4" /> Two-factor authentication is on</>
            ) : (
              <><Unlock className="size-4" /> Two-factor authentication is off</>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {enabled ? (
            <div className="space-y-3">
              <Badge variant="default" className="gap-1">
                <Check className="size-3" /> Enabled
              </Badge>
              <p className="text-sm text-muted-foreground">
                Admin accounts require 2FA to access protected routes.
              </p>
              <div className="space-y-2">
                <Label>Disable 2FA</Label>
                <Input
                  type="password"
                  value={disablePwd}
                  onChange={(e) => setDisablePwd(e.target.value)}
                  placeholder="Enter password to confirm"
                />
                <Button
                  variant="destructive"
                  disabled={!disablePwd || disableMut.isPending}
                  onClick={() => disableMut.mutate()}
                >
                  {disableMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                  Disable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="size-3" /> Not enabled
              </Badge>
              <p className="text-sm text-muted-foreground">
                Protect your account with an authenticator app.
              </p>
              {!setup ? (
                <Button onClick={() => setupMut.mutate()}>
                  <ShieldCheck className="size-4 mr-2" /> Enable 2FA
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-2">Scan this QR with Google Authenticator, 1Password, or Authy.</p>
                        <code className="block rounded-md bg-muted/50 px-2 py-1 font-mono text-[11px]">
                          {setup.qrUrl}
                        </code>
                      </div>
                      <QrCode className="size-10 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      Backup codes
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {setup.backupCodes.map((c, i) => (
                        <code key={i} className="rounded-md bg-muted/50 px-2 py-1 font-mono text-xs">
                          {c}
                        </code>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Save these now. Each code can be used once if you lose access.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Enter 6-digit code to verify</Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                    />
                    <Button
                      className="w-full"
                      disabled={code.trim().length !== 6 || verifyMut.isPending}
                      onClick={() => verifyMut.mutate()}
                    >
                      {verifyMut.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Verify and enable
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

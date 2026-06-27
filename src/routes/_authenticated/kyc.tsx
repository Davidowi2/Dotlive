import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Check,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  IdCard,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { dotApi } from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({ meta: [{ title: "KYC — DOT Wallet" }] }),
  component: KycPage,
});

type Tier = "tier1" | "tier2" | "tier3";

const TIER_INFO: Record<Tier, { label: string; limit: number; requirements: string[] }> = {
  tier1: {
    label: "Tier 1 — Email",
    limit: 5_000,
    requirements: ["Email verified (default on signup)"],
  },
  tier2: {
    label: "Tier 2 — BVN",
    limit: 100_000,
    requirements: ["BVN (Bank Verification Number) — 11 digits"],
  },
  tier3: {
    label: "Tier 3 — BVN + NIN + Gov ID",
    limit: Infinity,
    requirements: [
      "BVN (Bank Verification Number) — 11 digits",
      "NIN (National Identification Number) — 11 digits",
      "Government-issued ID (passport, driver's license, voter's card, or national ID)",
      "Full legal name, date of birth, address",
    ],
  },
};

function KycPage() {
  const [kyc, setKyc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form fields
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [govIdType, setGovIdType] = useState("passport");
  const [govIdUrl, setGovIdUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  
interface KycSubmission {
  bvn?: string;
  nin?: string;
  govIdType?: string;
  govIdUrl?: string;
  fullName?: string;
  dateOfBirth?: string;
  address?: string;
  targetTier?: string;
  withdrawalLimit?: number;
  status?: string;
}

interface KycTier {
  id: string;
  name: string;
  withdrawalLimit: number;
}


async function load() {
    setLoading(true);
    try {
      const res = await dotApi.get<{ kyc: KycSubmission | null }>("/api/kyc/me");
      setKyc(res?.kyc ?? null);
      // pre-fill if returning
      if (res?.kyc) {
        setBvn(res.kyc.bvn ?? "");
        setNin(res.kyc.nin ?? "");
        setGovIdType(res.kyc.govIdType ?? "passport");
        setGovIdUrl(res.kyc.govIdUrl ?? "");
        setFullName(res.kyc.fullName ?? "");
        setDateOfBirth(res.kyc.dateOfBirth ?? "");
        setAddress(res.kyc.address ?? "");
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const currentTier: Tier = (kyc?.status === "approved" ? kyc.tier : "tier1") as Tier;
  const targetTier: Tier = (nin.length === 11 && govIdUrl && bvn.length === 11)
    ? "tier3"
    : bvn.length === 11 ? "tier2" : "tier1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = { country: "NG" };
      if (bvn) payload.bvn = bvn;
      if (nin) payload.nin = nin;
      if (govIdUrl) {
        payload.govIdUrl = govIdUrl;
        payload.govIdType = govIdType;
        payload.fullName = fullName;
        payload.dateOfBirth = dateOfBirth;
        payload.address = address;
      }
      const res = await dotApi.post<{ targetTier: string; withdrawalLimit: number }>("/api/kyc/submit", payload);
      toast.success(`Submitted for ${res?.targetTier}. Limit: ${(res?.withdrawalLimit ?? 0).toLocaleString()} DOT.`);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="KYC Verification" subtitle="Loading..." />
      </AppShell>
    );
  }

  const status = kyc?.status ?? "not_submitted";
  const isApproved = status === "approved";

  return (
    <AppShell>
      <PageHeader
        title="KYC Verification"
        subtitle="Verify your identity to unlock higher withdrawal limits."
      />

      <div className="space-y-6">
        {/* Current status */}
        <Card className={cn(
          "border-2",
          isApproved ? "border-primary/40 bg-primary/5"
            : status === "pending" ? "border-amber-500/40 bg-amber-500/5"
            : status === "rejected" ? "border-destructive/40 bg-destructive/5"
            : "border-border"
        )}>
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <div className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                isApproved ? "bg-primary text-primary-foreground"
                  : status === "pending" ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}>
                {isApproved ? <Check className="size-5" /> : status === "pending" ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
              </div>
              <div>
                <div className="font-semibold">
                  {isApproved ? "Verified"
                    : status === "pending" ? "Under review"
                    : status === "rejected" ? "Rejected"
                    : "Not submitted"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isApproved
                    ? `Tier ${currentTier.replace("tier", "")} · up to ${(TIER_INFO[currentTier].limit === Infinity ? "∞" : TIER_INFO[currentTier].limit.toLocaleString())} DOT per withdrawal`
                    : status === "pending"
                    ? "Your submission is being reviewed. Usually takes 1–2 business days."
                    : status === "rejected"
                    ? `Reason: ${kyc?.rejectionReason ?? "Not provided"}. Please resubmit.`
                    : "Submit your details below to verify your identity."}
                </div>
              </div>
            </div>
            {kyc?.reviewedAt && (
              <div className="text-xs text-muted-foreground text-right shrink-0">
                Reviewed<br />{new Date(kyc.reviewedAt).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tier ladder */}
        <div className="grid gap-3 md:grid-cols-3">
          {(Object.keys(TIER_INFO) as Tier[]).map((t) => {
            const isCurrent = t === currentTier && isApproved;
            const isUnlocked = (t === "tier1") || (t === "tier2" && (isApproved ? currentTier !== "tier1" : true)) || (t === "tier3" && (isApproved ? currentTier === "tier3" : (targetTier === "tier3" || currentTier === "tier2")));
            return (
              <Card key={t} className={cn(
                "border",
                isCurrent ? "border-primary bg-primary/5" : isUnlocked ? "border-border" : "border-border/50 opacity-60"
              )}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className={cn("size-4", isCurrent ? "text-primary" : "text-muted-foreground")} />
                    <div className="font-medium">{TIER_INFO[t].label}</div>
                    {isCurrent && <Check className="size-4 text-primary ml-auto" />}
                  </div>
                  <div className="mt-2 text-2xl font-bold tabular-nums">
                    {TIER_INFO[t].limit === Infinity ? "∞" : `${TIER_INFO[t].limit.toLocaleString()} DOT`}
                  </div>
                  <div className="text-xs text-muted-foreground">withdrawal limit</div>
                  <ul className="mt-3 space-y-1 text-xs">
                    {TIER_INFO[t].requirements.map((r) => (
                      <li key={r} className="flex items-start gap-1.5">
                        <Check className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submission form */}
        {!isApproved && (
          <Card>
            <CardHeader>
              <CardTitle>Submit KYC information</CardTitle>
              <CardDescription>
                Submitting Tier 2 (BVN) unlocks withdrawals up to 100,000 DOT. Tier 3 (BVN+NIN+ID) is unlimited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>BVN — Bank Verification Number</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={bvn}
                      onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="11-digit BVN"
                      maxLength={11}
                      className="pl-9 tabular-nums"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{bvn.length}/11 digits</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <IdCard className="size-4" />
                    Optional: Tier 3 (BVN + NIN + Gov ID) for unlimited withdrawals
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>NIN — National Identification Number</Label>
                  <Input
                    value={nin}
                    onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="11-digit NIN"
                    maxLength={11}
                    className="tabular-nums"
                  />
                  <p className="text-xs text-muted-foreground">{nin.length}/11 digits</p>
                </div>

                <div className="space-y-2">
                  <Label>Government ID type</Label>
                  <select
                    value={govIdType}
                    onChange={(e) => setGovIdType(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="passport">International passport</option>
                    <option value="drivers_license">Driver's license</option>
                    <option value="voters_card">Voter's card</option>
                    <option value="national_id">National ID card</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Government ID URL (uploaded image)</Label>
                  <Input
                    value={govIdUrl}
                    onChange={(e) => setGovIdUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/.../id.jpg"
                  />
                  <p className="text-xs text-muted-foreground">Upload to your cloud storage and paste the URL. (Cloudinary integration coming soon.)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Full legal name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As on ID" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of birth</Label>
                    <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Residential address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State" />
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Target tier: <strong>{targetTier}</strong> · Limit:{" "}
                    <strong>{TIER_INFO[targetTier].limit === Infinity ? "∞" : `${TIER_INFO[targetTier].limit.toLocaleString()} DOT`}</strong>
                  </div>
                  <Button type="submit" disabled={submitting || !bvn}>
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                    Submit for review
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          Questions about KYC? <Link to="/" className="text-primary underline">Read the policy</Link> or contact support.
        </div>
      </div>
    </AppShell>
  );
}
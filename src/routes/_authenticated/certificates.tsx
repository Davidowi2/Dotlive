import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Download,
  ExternalLink,
  Star,
  GraduationCap,
  Calendar,
  Trophy,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dotApi } from "@/api/client";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({ meta: [{ title: "Certificates — DOT" }] }),
  component: CertificatesPage,
});

interface Certificate {
  id: string;
  userId: string;
  courseId: string | null;
  title: string;
  issuer: string;
  score: number | null;
  dotEarned: number;
  level: string | null;
  credentialId: string;
  issuedAt: string;
}

function CertificatesPage() {
  const { token } = useDotAuth();
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const certsQ = useQuery({
    queryKey: ["certificates", "me"],
    queryFn: async () => {
      const r = await dotApi.get<{ certificates: Certificate[] }>("/api/certificates/me");
      return r.certificates ?? [];
    },
  });

  const seedM = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/certificates/seed", {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!r.ok) throw new Error((await r.text()) || "Failed to seed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Sample certificates added");
      qc.invalidateQueries({ queryKey: ["certificates", "me"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const downloadCert = async (id: string, credentialId: string) => {
    try {
      const res = await fetch(`/api/certificates/${id}/download`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DOT-${credentialId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificate downloaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Download failed");
    }
  };

  const certs = certsQ.data ?? [];
  const totalDot = certs.reduce((sum, c) => sum + c.dotEarned, 0);
  const latest = certs[0];
  const loading = certsQ.isLoading;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Growth"
        title="Certificates"
        subtitle="Credentials earned from DOT Academy courses and live sessions."
        action={
          <Badge variant="secondary" className="font-medium">
            <Award className="mr-1.5 size-3" />
            {certs.length} earned
          </Badge>
        }
      />

      {loading ? (
        <div className="mt-10 flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading your certificates…
        </div>
      ) : certs.length === 0 ? (
        <div className="mt-10 space-y-4">
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Complete Academy courses to earn DOT credentials. Each certificate is verifiable by credential ID."
            action={
              <Button variant="hero" size="sm">
                <GraduationCap className="size-4" />
                Browse Academy
              </Button>
            }
          />
          {/* Quick-seed for dev: lets new users see real certificate cards without doing a course first */}
          <div className="mx-auto max-w-md rounded-xl border border-dashed border-border bg-card/40 p-4 text-center">
            <Sparkles className="mx-auto size-4 text-amber-500" />
            <p className="mt-2 text-sm font-medium">Test the experience</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add three sample certificates to your profile so you can see how Download + View work.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              disabled={seedM.isPending}
              onClick={() => seedM.mutate()}
            >
              {seedM.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {seedM.isPending ? "Adding…" : "Add sample certificates"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ─── Summary strip ──────────────────────────────────────── */}
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <SummaryTile
              icon={Trophy}
              label="Certificates earned"
              value={String(certs.length)}
              sub="across Academy"
              accent="primary"
            />
            <SummaryTile
              icon={Star}
              label="DOT from credentials"
              value={totalDot.toLocaleString()}
              sub="added to wallet"
              accent="gold"
            />
            <SummaryTile
                          icon={ShieldCheck}
                          label="Latest credential"
                          value={latest ? (latest.level ?? "Issued") : "—"}
                          sub={latest ? latest.title : "complete a course to earn one"}
                          accent="muted"
                        />
          </section>

          {/* ─── Section divider ───────────────────────────────────── */}
          <hr className="my-10 border-border" />

          {/* ─── Featured / latest ─────────────────────────────────── */}
          <section>
            <PageHeader
              variant="compact"
              title="Most recent"
              subtitle="Your newest credential. View full details or download for your records."
            />

            <article className="mt-5 grid gap-6 rounded-sm border border-border bg-card p-6 shadow-soft lg:grid-cols-[auto_1fr_auto]">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-sm [background-image:var(--gradient-gold)] text-gold-foreground">
                <Award className="size-10" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{latest.level}</Badge>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {latest.credentialId}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-light tracking-tight">
                  {latest.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Issued by {latest.issuer} Academy · {latest.courseId ?? "DOT Academy"}
                </p>

                <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Score
                    </dt>
                    <dd className="mt-1 font-display text-xl font-light tabular text-primary">
                      {latest.score}<span className="text-sm text-muted-foreground">/100</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Issued
                    </dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-sm">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {latest.issuedAt ? new Date(latest.issuedAt).toLocaleDateString() : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Reward
                    </dt>
                    <dd className="mt-1 flex items-center gap-1 text-sm font-medium text-gold">
                      <Star className="size-3.5 fill-current" />
                      +{latest.dotEarned} DOT
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex shrink-0 flex-col gap-2 lg:w-40">
                <Button variant="hero" size="sm">
                  <ExternalLink className="size-4" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </article>
          </section>

          {/* ─── Section divider ───────────────────────────────────── */}
          <hr className="my-10 border-border" />

          {/* ─── All certificates ──────────────────────────────────── */}
          <section>
            <PageHeader
              variant="compact"
              title="All credentials"
              subtitle="Every certificate you've earned, newest first."
              action={
                <Button variant="ghost" size="sm">
                  <Download className="size-4" />
                  Export all
                </Button>
              }
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certs.map((c) => (
                <article
                  key={c.id}
                  className="flex flex-col rounded-sm border border-border bg-card p-5 transition-all hover:border-foreground/20"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-sm [background-image:var(--gradient-gold)] text-gold-foreground">
                      <Award className="size-6" />
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {c.level ?? "—"}
                    </Badge>
                  </div>

                  <h3 className="mt-4 font-display text-base font-semibold leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Issued by {c.issuer} · {new Date(c.issuedAt).toLocaleDateString()}
                  </p>

                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="uppercase tracking-wider text-muted-foreground">
                        Score
                      </dt>
                      <dd className="mt-0.5 font-display text-lg font-light tabular text-primary">
                        {c.score ?? "—"}{c.score != null && <span className="text-xs text-muted-foreground">/100</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wider text-muted-foreground">
                        Issued
                      </dt>
                      <dd className="mt-0.5 flex items-center gap-1 text-foreground">
                        <Calendar className="size-3 text-muted-foreground" />
                        {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "—"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="flex items-center gap-1 font-medium text-gold">
                      <Star className="size-3 fill-current" />
                      +{c.dotEarned} DOT
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {c.credentialId}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <ExternalLink className="size-3.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadCert(c.id, c.credentialId)}
                    >
                      <Download className="size-3.5" />
                      Download
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

/* ─── Internal helpers ────────────────────────────────────────────── */

function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  sub: string;
  accent: "primary" | "gold" | "muted";
}) {
  const accentClass =
    accent === "primary"
      ? "text-primary"
      : accent === "gold"
        ? "text-gold"
        : "text-muted-foreground";

  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">
          {label}
        </span>
        <span className={`flex size-7 items-center justify-center ${accentClass}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-light leading-none tracking-tight tabular">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

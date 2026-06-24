import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  Download,
  ExternalLink,
  Star,
  GraduationCap,
  Calendar,
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({ meta: [{ title: "Certificates — DOT" }] }),
  component: CertificatesPage,
});

/* Sample placeholder inventory — these illustrate the visual shape of a
 * certificate card. Real issuance will come from the Academy once a course
 * is completed and graded. Until then, counts and dates are illustrative. */
const SAMPLE_CERTS = [
  {
    id: "1",
    title: "LEAPFROG Founder Foundations",
    course: "DOT Academy",
    issuer: "DOT",
    issued: "Jun 15, 2026",
    score: 92,
    dotEarned: 500,
    level: "Foundations",
    credentialId: "DOT-FF-2026-0184",
  },
  {
    id: "2",
    title: "Venture Design Thinking",
    course: "DOT Academy",
    issuer: "DOT",
    issued: "Jun 10, 2026",
    score: 88,
    dotEarned: 750,
    level: "Intermediate",
    credentialId: "DOT-VDT-2026-0091",
  },
  {
    id: "3",
    title: "Customer Discovery Mastery",
    course: "DOT Academy",
    issuer: "DOT",
    issued: "May 28, 2026",
    score: 95,
    dotEarned: 1000,
    level: "Advanced",
    credentialId: "DOT-CDM-2026-0063",
  },
];

function CertificatesPage() {
  const totalDot = SAMPLE_CERTS.reduce((sum, c) => sum + c.dotEarned, 0);
  const latest = SAMPLE_CERTS[0];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Growth"
        title="Certificates"
        subtitle="Credentials earned from DOT Academy courses and live sessions."
        action={
          <Badge variant="secondary" className="font-medium">
            <Award className="mr-1.5 size-3" />
            {SAMPLE_CERTS.length} earned
          </Badge>
        }
      />

      {SAMPLE_CERTS.length === 0 ? (
        <div className="mt-10">
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
        </div>
      ) : (
        <>
          {/* ─── Summary strip ──────────────────────────────────────── */}
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <SummaryTile
              icon={Trophy}
              label="Certificates earned"
              value={String(SAMPLE_CERTS.length)}
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
              value={latest ? latest.level : "—"}
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
                  Issued by {latest.issuer} Academy · {latest.course}
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
                      {latest.issued}
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
              {SAMPLE_CERTS.map((c) => (
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
                      {c.level}
                    </Badge>
                  </div>

                  <h3 className="mt-4 font-display text-base font-semibold leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Issued by {c.issuer} · {c.course}
                  </p>

                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="uppercase tracking-wider text-muted-foreground">
                        Score
                      </dt>
                      <dd className="mt-0.5 font-display text-lg font-light tabular text-primary">
                        {c.score}<span className="text-xs text-muted-foreground">/100</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-wider text-muted-foreground">
                        Issued
                      </dt>
                      <dd className="mt-0.5 flex items-center gap-1 text-foreground">
                        <Calendar className="size-3 text-muted-foreground" />
                        {c.issued}
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
                    <Button variant="outline" size="sm" className="flex-1">
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

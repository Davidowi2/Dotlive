import { createFileRoute } from "@tanstack/react-router";
import { Award, Download, ExternalLink, Star } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({ meta: [{ title: "Certificates — DOT" }] }),
  component: CertificatesPage,
});

const MOCK_CERTS = [
  { id: "1", title: "LEAPFROG Founder Foundations", course: "DOT Academy", issued: "Jun 15, 2026", dotEarned: 500, level: "Foundations" },
  { id: "2", title: "Venture Design Thinking", course: "DOT Academy", issued: "Jun 10, 2026", dotEarned: 750, level: "Intermediate" },
  { id: "3", title: "Customer Discovery Mastery", course: "DOT Academy", issued: "May 28, 2026", dotEarned: 1000, level: "Advanced" },
];

function CertificatesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Certificates"
        subtitle="Your earned credentials from DOT Academy."
        action={<Badge variant="secondary"><Award className="mr-1 size-3" />{MOCK_CERTS.length} earned</Badge>}
      />

      {MOCK_CERTS.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete Academy courses to earn DOT credentials."
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_CERTS.map((c) => (
            <div key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
              {/* Certificate header */}
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl [background-image:var(--gradient-gold)] text-gold-foreground shadow-soft">
                  <Award className="size-6" />
                </span>
                <Badge variant="outline">{c.level}</Badge>
              </div>

              <h3 className="mt-4 font-display text-base font-semibold leading-snug">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.course}</p>

              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Issued {c.issued}</span>
                <span className="flex items-center gap-1 text-gold">
                  <Star className="size-3 fill-current" /> +{c.dotEarned} DOT
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <ExternalLink className="size-3.5" /> View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="size-3.5" /> Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

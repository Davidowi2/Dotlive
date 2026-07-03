/**
 * Public builder profile.
 *
 * The "hire this person" page. Shows:
 *   - Avatar, name, headline, location, links
 *   - Skills + bio
 *   - Public stats: DOT earned, contracts completed, avg rating
 *   - Available for hire toggle (if you own this profile)
 *   - Reviews list
 *
 * Owner can edit in-place (text inputs + available toggle).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin, Globe, Linkedin, Twitter, Github, Briefcase,
  Trophy, Star, Edit3, Check, X, MessageSquare,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  getBuilderArena,
  getBuilderReviews,
  type BuilderPublic,
  type BuilderReview,
} from "@/api/builders";
import { updateMyBuilderProfile } from "@/api/users";

export const Route = createFileRoute("/_authenticated/builder/$id")({
  head: () => ({ meta: [{ title: "Builder · DOT Arena" }] }),
  component: BuilderProfilePage,
});

function BuilderProfilePage() {
  const { id } = Route.useParams();
  const { user } = useDotAuth();
  const qc = useQueryClient();

  const { data: builder, isLoading } = useQuery({
    queryKey: ["builder-arena", id],
    queryFn: () => getBuilderArena(id),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["builder-reviews", id],
    queryFn: () => getBuilderReviews(id),
  });

  const isOwner = !!user && user.id === id;

  if (isLoading || !builder) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Builder Arena"
          title={builder.name ?? "Anonymous builder"}
          subtitle={builder.profile?.headline ?? "DOT builder"}
          action={
            isOwner ? (
              <Link
                to="/work"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40"
              >
                <Edit3 className="size-3" /> Edit in DOT Work
              </Link>
            ) : (
              <Button asChild size="sm">
                <Link
                  to="/discover/people"
                  search={{ message: builder.id }}
                >
                  <MessageSquare className="mr-1.5 size-3.5" /> Request meeting
                </Link>
              </Button>
            )
          }
        />

        {/* Header card */}
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
            <Avatar className="size-20 shrink-0">
              {builder.avatarUrl && <AvatarImage src={builder.avatarUrl} />}
              <AvatarFallback className="text-2xl">
                {(builder.name ?? "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-light tracking-tight">
                  {builder.name}
                </h2>
                {builder.profile?.available && (
                  <Badge variant="default" className="text-[10px]">
                    <Check className="mr-1 size-3" /> Available
                  </Badge>
                )}
                <span className="font-mono text-[10px] text-muted-foreground">
                  {builder.dotId}
                </span>
              </div>
              {builder.profile?.headline && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {builder.profile.headline}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {builder.profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {builder.profile.location}
                  </span>
                )}
                {builder.profile?.portfolioUrl && (
                  <a href={builder.profile.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <Globe className="size-3" /> Portfolio
                  </a>
                )}
                {builder.profile?.linkedinUrl && (
                  <a href={builder.profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <Linkedin className="size-3" /> LinkedIn
                  </a>
                )}
                {builder.profile?.twitterUrl && (
                  <a href={builder.profile.twitterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <Twitter className="size-3" /> Twitter
                  </a>
                )}
                {builder.profile?.githubUrl && (
                  <a href={builder.profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <Github className="size-3" /> GitHub
                  </a>
                )}
              </div>
              {builder.profile?.skills && builder.profile.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {builder.profile.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:grid-cols-1 sm:gap-3">
              <Stat
                label="DOT earned"
                value={Math.round(Number(builder.profile?.totalEarnedDot ?? 0))}
              />
              <Stat
                label="Contracts"
                value={builder.profile?.totalCompletedOrders ?? 0}
              />
              <Stat
                label="Avg rating"
                value={Number(builder.profile?.avgRating ?? 0).toFixed(1)}
                icon={<Star className="size-3 text-amber-400" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bio + edit */}
        {isOwner ? (
          <OwnerEditor builder={builder} onSaved={() => qc.invalidateQueries({ queryKey: ["builder-arena", id] })} />
        ) : (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-display text-lg font-light tracking-tight">About</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {builder.profile?.bio ?? "No bio yet."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Reviews */}
        <section className="mt-10">
          <h3 className="flex items-center gap-1.5 font-display text-lg font-light tracking-tight">
            <Trophy className="size-4 text-amber-500" /> Reviews ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {reviews.map((r) => (
                <ReviewRow key={r.id} review={r} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <p className="flex items-center justify-center gap-1 font-display text-xl font-light tabular text-primary">
        {icon}{value}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ReviewRow({ review }: { review: BuilderReview }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-3.5 ${
              i < review.rating ? "fill-amber-400" : "text-muted-foreground/30"
            }`}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      {review.comment && (
        <p className="mt-2 text-sm">{review.comment}</p>
      )}
    </li>
  );
}

function OwnerEditor({
  builder,
  onSaved,
}: {
  builder: BuilderPublic;
  onSaved: () => void;
}) {
  const p = builder.profile;
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState(p?.headline ?? "");
  const [bio, setBio] = useState(p?.bio ?? "");
  const [skills, setSkills] = useState((p?.skills ?? []).join(", "));
  const [hourlyDot, setHourlyDot] = useState(p?.hourlyDot ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(p?.portfolioUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(p?.linkedinUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(p?.twitterUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(p?.githubUrl ?? "");
  const [location, setLocation] = useState(p?.location ?? "");
  const [available, setAvailable] = useState(p?.available ?? false);

  const saveMut = useMutation({
    mutationFn: () =>
      updateMyBuilderProfile({
        headline, bio,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        available,
        hourlyDot: hourlyDot || undefined,
        portfolioUrl: portfolioUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        twitterUrl: twitterUrl || undefined,
        githubUrl: githubUrl || undefined,
        location: location || undefined,
      } as any),
    onSuccess: () => {
      setEditing(false);
      onSaved();
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Could not save profile");
    },
  });

  if (!editing) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-light tracking-tight">About</h3>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Edit3 className="mr-1.5 size-3.5" /> Edit
            </Button>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {p?.bio ?? "No bio yet. Add one to attract clients."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-light tracking-tight">Edit profile</h3>
          <Button size="icon" variant="ghost" onClick={() => setEditing(false)}>
            <X className="size-4" />
          </Button>
        </div>
        <Field label="Headline">
          <Input value={headline} onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Full-stack TypeScript / React" />
        </Field>
        <Field label="Bio">
          <Textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)}
            placeholder="What do you build? Concrete wins over fluff." />
        </Field>
        <Field label="Skills (comma-separated)">
          <Input value={skills} onChange={(e) => setSkills(e.target.value)}
            placeholder="TypeScript, React, Postgres" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Hourly rate (DOT)">
            <Input type="number" min="0" value={hourlyDot} onChange={(e) => setHourlyDot(e.target.value)} />
          </Field>
          <Field label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Lagos, Nigeria" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Portfolio URL"><Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} /></Field>
          <Field label="LinkedIn URL"><Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} /></Field>
          <Field label="Twitter URL"><Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} /></Field>
          <Field label="GitHub URL"><Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="size-4 accent-primary"
          />
          Available for hire
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
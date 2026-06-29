/**
 * VentureEnrichmentSection — full founder profile (11 fields).
 *
 * Sections:
 *   1. One-liner + Problem / Solution
 *   2. Traction (MRR, paying users, growth %, retention %)
 *   3. Cap table (total raised, last round, structure)
 *   4. Use of funds
 *   5. Pitch deck link
 *   6. Founding date + Stage rationale
 *   7. Team (founders + members)
 *   8. Milestones (past + upcoming)
 *   9. Advisors
 *
 * Reads: GET /api/ventures/:id/enrichment
 * Writes: PUT /api/ventures/:id/details, POST /api/ventures/:id/{team,milestones,advisors}
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Users,
  Calendar,
  Target,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Lightbulb,
  Wrench,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  getVentureEnrichment,
  updateVentureDetails,
  addTeamMember,
  removeTeamMember,
  addMilestone,
  removeMilestone,
  addAdvisor,
  removeAdvisor,
  type VentureEnrichment,
  type TeamMember,
  type Milestone,
  type Advisor,
} from "@/api/founder";

export function VentureEnrichmentSection({
  ventureId,
  isOwner = false,
}: {
  ventureId: string;
  isOwner?: boolean;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["venture-enrichment", ventureId],
    queryFn: () => getVentureEnrichment(ventureId),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl border border-border bg-card/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
        No venture details yet.
      </div>
    );
  }

  const { details, team, milestones, advisors } = data;

  return (
    <div className="space-y-8">
      {/* 1. One-liner / Problem / Solution */}
      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-light tracking-tight">
            <Sparkles className="size-4 text-primary" />
            The pitch
          </h2>
          {details?.oneLiner ? (
            <p className="mt-3 text-base font-medium">{details.oneLiner}</p>
          ) : (
            <p className="mt-3 text-sm italic text-muted-foreground">
              No one-liner yet.
            </p>
          )}
          {details?.problem && (
            <div className="mt-4">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Lightbulb className="size-3" /> Problem
              </h3>
              <p className="mt-1 text-sm">{details.problem}</p>
            </div>
          )}
          {details?.solution && (
            <div className="mt-4">
              <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Wrench className="size-3" /> Solution
              </h3>
              <p className="mt-1 text-sm">{details.solution}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Traction */}
      <Card>
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-light tracking-tight">
            <TrendingUp className="size-4 text-primary" /> Traction
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              label="MRR"
              value={
                Number(details?.tractionMr ?? 0) > 0
                  ? formatNaira(Number(details?.tractionMr ?? 0) * 15)
                  : "—"
              }
            />
            <StatTile
              label="Paying users"
              value={(details?.tractionPayingUsers ?? 0).toString()}
            />
            <StatTile
              label="MoM growth"
              value={
                details?.tractionGrowthPct
                  ? `${details.tractionGrowthPct}%`
                  : "—"
              }
            />
            <StatTile
              label="Retention (90d)"
              value={
                details?.tractionRetentionPct
                  ? `${details.tractionRetentionPct}%`
                  : "—"
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 3 + 4. Cap table + Use of funds */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-light tracking-tight">
              <Briefcase className="size-4 text-primary" /> Cap table
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Total raised">
                {Number(details?.capTableTotalRaised ?? 0) > 0
                  ? formatNaira(Number(details?.capTableTotalRaised ?? 0) * 15)
                  : "—"}
              </Row>
              <Row label="Last round">{details?.capTableLastRound ?? "—"}</Row>
              <Row label="Structure">{details?.capTableStructure ?? "—"}</Row>
            </dl>
            {details?.pitchDeckUrl && (
              <a
                href={details.pitchDeckUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                View pitch deck <ExternalLink className="size-3.5" />
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-light tracking-tight">
              <Target className="size-4 text-primary" /> Use of funds
            </h2>
            <p className="mt-3 text-sm text-foreground/90">
              {details?.useOfFunds ?? "—"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
              <Row label="Founded">
                {details?.foundingDate ?? "—"}
              </Row>
              <Row label="Stage rationale">
                {details?.stageRationale ?? "—"}
              </Row>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7. Team */}
      <TeamSection
        ventureId={ventureId}
        team={team}
        isOwner={isOwner}
        onChange={() => qc.invalidateQueries({ queryKey: ["venture-enrichment", ventureId] })}
      />

      {/* 8. Milestones */}
      <MilestonesSection
        ventureId={ventureId}
        milestones={milestones}
        isOwner={isOwner}
        onChange={() => qc.invalidateQueries({ queryKey: ["venture-enrichment", ventureId] })}
      />

      {/* 9. Advisors */}
      <AdvisorsSection
        ventureId={ventureId}
        advisors={advisors}
        isOwner={isOwner}
        onChange={() => qc.invalidateQueries({ queryKey: ["venture-enrichment", ventureId] })}
      />
    </div>
  );
}

/* ============== Subsections ============== */

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-light tabular">{value}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function TeamSection({
  ventureId,
  team,
  isOwner,
  onChange,
}: {
  ventureId: string;
  team: TeamMember[];
  isOwner: boolean;
  onChange: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-light tracking-tight">
          <Users className="size-4 text-primary" /> Team
        </h2>
        {team.length === 0 ? (
          <p className="mt-3 text-sm italic text-muted-foreground">
            No team members listed.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {team.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {m.name}{" "}
                    {m.isFounder && (
                      <span className="ml-1 text-[10px] uppercase tracking-wider text-primary">
                        Founder
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.role}
                    {m.linkedinUrl && (
                      <>
                        {" · "}
                        <a
                          href={m.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground"
                        >
                          LinkedIn
                        </a>
                      </>
                    )}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={async () => {
                      await removeTeamMember(ventureId, m.id);
                      onChange();
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove team member"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {isOwner && <AddTeamForm ventureId={ventureId} onChange={onChange} />}
      </CardContent>
    </Card>
  );
}

function AddTeamForm({
  ventureId,
  onChange,
}: {
  ventureId: string;
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isFounder, setIsFounder] = useState(false);
  const m = useMutation({
    mutationFn: () =>
      addTeamMember(ventureId, { name, role, linkedinUrl, isFounder, orderIndex: 0 }),
  });

  return (
    <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 md:grid-cols-5">
      <Input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <Input
        placeholder="LinkedIn URL"
        value={linkedinUrl}
        onChange={(e) => setLinkedinUrl(e.target.value)}
        className="md:col-span-2"
      />
      <Button
        type="button"
        variant="outline"
        disabled={!name || !role || m.isPending}
        onClick={async () => {
          await m.mutateAsync();
          setName("");
          setRole("");
          setLinkedinUrl("");
          setIsFounder(false);
          onChange();
        }}
      >
        <Plus className="mr-1.5 size-4" /> Add
      </Button>
    </div>
  );
}

function MilestonesSection({
  ventureId,
  milestones,
  isOwner,
  onChange,
}: {
  ventureId: string;
  milestones: Milestone[];
  isOwner: boolean;
  onChange: () => void;
}) {
  const past = milestones.filter((m) => !m.isUpcoming);
  const upcoming = milestones.filter((m) => m.isUpcoming);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-light tracking-tight">
          <Calendar className="size-4 text-primary" /> Milestones
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <CircleCheck className="size-3" /> Past
            </h3>
            {past.length === 0 ? (
              <p className="mt-2 text-sm italic text-muted-foreground">
                No completed milestones.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {past.map((m) => (
                  <li key={m.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p>{m.title}</p>
                      {m.achievedAt && (
                        <p className="text-xs text-muted-foreground">
                          {m.achievedAt}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <CircleDashed className="size-3" /> Upcoming
            </h3>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm italic text-muted-foreground">
                No upcoming milestones.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {upcoming.map((m) => (
                  <li key={m.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full border border-border bg-card" />
                    <div>
                      <p>{m.title}</p>
                      {m.targetDate && (
                        <p className="text-xs text-muted-foreground">
                          {m.targetDate}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {isOwner && <AddMilestoneForm ventureId={ventureId} onChange={onChange} />}
      </CardContent>
    </Card>
  );
}

function AddMilestoneForm({
  ventureId,
  onChange,
}: {
  ventureId: string;
  onChange: () => void;
}) {
  const [title, setTitle] = useState("");
  const [isUpcoming, setIsUpcoming] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [achievedAt, setAchievedAt] = useState("");
  const m = useMutation({
    mutationFn: () =>
      addMilestone(ventureId, {
        title,
        isUpcoming,
        targetDate: isUpcoming ? targetDate || undefined : undefined,
        achievedAt: !isUpcoming ? achievedAt || undefined : undefined,
        orderIndex: 0,
      }),
  });

  return (
    <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 md:grid-cols-5">
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="md:col-span-2"
      />
      <select
        value={isUpcoming ? "upcoming" : "past"}
        onChange={(e) => setIsUpcoming(e.target.value === "upcoming")}
        className="rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="past">Past</option>
        <option value="upcoming">Upcoming</option>
      </select>
      {isUpcoming ? (
        <Input
          type="date"
          placeholder="Target date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      ) : (
        <Input
          type="date"
          placeholder="Achieved date"
          value={achievedAt}
          onChange={(e) => setAchievedAt(e.target.value)}
        />
      )}
      <Button
        type="button"
        variant="outline"
        disabled={!title || m.isPending}
        onClick={async () => {
          await m.mutateAsync();
          setTitle("");
          setTargetDate("");
          setAchievedAt("");
          onChange();
        }}
      >
        <Plus className="mr-1.5 size-4" /> Add
      </Button>
    </div>
  );
}

function AdvisorsSection({
  ventureId,
  advisors,
  isOwner,
  onChange,
}: {
  ventureId: string;
  advisors: Advisor[];
  isOwner: boolean;
  onChange: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-light tracking-tight">
          <GraduationCap className="size-4 text-primary" /> Advisors
        </h2>
        {advisors.length === 0 ? (
          <p className="mt-3 text-sm italic text-muted-foreground">
            No advisors listed.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {advisors.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{a.name}</p>
                  {a.credentials && (
                    <p className="text-xs text-muted-foreground">
                      {a.credentials}
                    </p>
                  )}
                </div>
                {isOwner && (
                  <button
                    onClick={async () => {
                      await removeAdvisor(ventureId, a.id);
                      onChange();
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {isOwner && <AddAdvisorForm ventureId={ventureId} onChange={onChange} />}
      </CardContent>
    </Card>
  );
}

function AddAdvisorForm({
  ventureId,
  onChange,
}: {
  ventureId: string;
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [credentials, setCredentials] = useState("");
  const m = useMutation({
    mutationFn: () => addAdvisor(ventureId, { name, credentials }),
  });

  return (
    <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 md:grid-cols-4">
      <Input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Credentials"
        value={credentials}
        onChange={(e) => setCredentials(e.target.value)}
        className="md:col-span-2"
      />
      <Button
        type="button"
        variant="outline"
        disabled={!name || m.isPending}
        onClick={async () => {
          await m.mutateAsync();
          setName("");
          setCredentials("");
          onChange();
        }}
      >
        <Plus className="mr-1.5 size-4" /> Add
      </Button>
    </div>
  );
}

function formatNaira(value: number) {
  if (value >= 1_000_000) {
    return `₦${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `₦${(value / 1_000).toFixed(1)}K`;
  }
  return `₦${value.toFixed(0)}`;
}

/**
 * PersonCard — a single user card in the People tab.
 */

import { Users, Briefcase, TrendingUp, Building2, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DiscoverPerson } from "@/api/people";

const ROLE_COPY: Record<string, { label: string; icon: typeof Users }> = {
  builder: { label: "Builder", icon: Briefcase },
  founder: { label: "Founder", icon: TrendingUp },
  investor: { label: "Investor", icon: Users },
  capital_partner: { label: "Capital Partner", icon: Building2 },
};

export function PersonCard({ person }: { person: DiscoverPerson }) {
  const roleMeta = ROLE_COPY[person.primaryRole] ?? { label: person.primaryRole, icon: Users };
  const RoleIcon = roleMeta.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-semibold">
              {(person.name ?? "U").charAt(0).toUpperCase()}
            </span>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{person.name ?? "User"}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RoleIcon className="size-3" />
              <span>{roleMeta.label}</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {person.vantageScore} VP
        </Badge>
      </div>

      <div className="space-y-2">
        {person.primaryRole === "builder" && person.builderSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {person.builderSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {person.primaryRole === "founder" && person.ventureName && (
          <div className="space-y-1">
            <p className="text-sm font-medium">{person.ventureName}</p>
            {person.ventureStage && (
              <Badge variant="secondary" className="text-[10px]">{person.ventureStage}</Badge>
            )}
          </div>
        )}

        {person.primaryRole === "investor" && person.capitalType && (
          <p className="text-xs text-muted-foreground">{person.capitalType}</p>
        )}

        {person.location && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-3" />
            <span>{person.location}</span>
          </div>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => toast.message("Coming soon")}
      >
        Connect
      </Button>
    </div>
  );
}

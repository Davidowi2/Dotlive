import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { vouchForBuilder, getBuilderVouches } from "@/api/builderDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, Heart, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";

interface BuilderVouchCardProps {
  builderId: string;
  builderName: string;
  className?: string;
}

export function BuilderVouchCard({
  builderId,
  builderName,
  className = "",
}: BuilderVouchCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [skill, setSkill] = useState("");
  const [comment, setComment] = useState("");
  const [isEndorsed, setIsEndorsed] = useState(true);

  const { data: vouchSummary } = useQuery({
    queryKey: ["builder-vouches", builderId],
    queryFn: () => getBuilderVouches(builderId),
  });

  const vouchMutation = useMutation({
    mutationFn: () =>
      vouchForBuilder(builderId, { skill, comment, isEndorsed }),
    onSuccess: () => {
      toast.success(`Vouch for "${skill}" added!`);
      setSkill("");
      setComment("");
      setIsEndorsed(true);
      setIsOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to vouch");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill.trim()) {
      toast.error("Skill required");
      return;
    }
    vouchMutation.mutate();
  };

  const totalVouches = vouchSummary?.total || 0;
  const topSkills = vouchSummary?.bySkill.slice(0, 3) || [];
  const endorsedCount = topSkills.reduce((sum, s) => sum + s.endorsed, 0);

  return (
    <Card className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Community Vouches</h3>
          <p className="text-2xl font-bold text-primary mt-1">{totalVouches}</p>
          <p className="text-xs text-muted-foreground">
            {endorsedCount} positive endorsements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          <MessageSquare className="h-6 w-6 text-blue-500" />
        </div>
      </div>

      {topSkills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Top Skills:</p>
          <div className="flex flex-wrap gap-2">
            {topSkills.map((skill) => (
              <div key={skill.skill} className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  {skill.skill}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {skill.endorsed}/{skill.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen ? (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t">
          <p className="text-sm font-medium">Vouch for {builderName}</p>

          <div className="space-y-2">
            <Label htmlFor="skill" className="text-xs">
              Skill or Trait *
            </Label>
            <Input
              id="skill"
              placeholder="e.g., React, Communication, Reliability"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-xs">
              Comment (optional)
            </Label>
            <textarea
              id="comment"
              placeholder="Why do you vouch for this?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="endorsed"
              checked={isEndorsed}
              onChange={(e) => setIsEndorsed(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="endorsed" className="text-xs cursor-pointer">
              I endorse this (uncheck to challenge)
            </Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={vouchMutation.isPending}
              className="gap-2"
            >
              {vouchMutation.isPending && <Loader className="h-3 w-3 animate-spin" />}
              {isEndorsed ? "Endorse" : "Challenge"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Vouch
        </Button>
      )}

      <p className="text-xs text-muted-foreground border-t pt-4">
        Vouches help builders build community trust and credibility. One skill per vouch.
      </p>
    </Card>
  );
}

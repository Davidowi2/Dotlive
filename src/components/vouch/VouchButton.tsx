/**
 * VouchButton — vouch a user.
 *
 * Renders a button that opens a dialog to pick the vouch scope. After a
 * successful vouch the button switches to a "Vouched ✓" confirm state.
 *
 * Disabled states:
 *   - viewing own profile
 *   - already vouched
 *   - viewer has no qualifying role
 */

import { useState } from "react";
import { ShieldCheck, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCreateVouch,
  useDeleteVouch,
  useVouches,
  type VouchScope,
  type Vouch,
} from "@/hooks/use-vouches";

interface VouchButtonProps {
  /** The user being vouched. */
  voucheeId: string;
  /** The current logged-in user id (or null when not signed in). */
  currentUserId: string | null;
  /** Compact variant — used in cards/rows. */
  compact?: boolean;
  className?: string;
}

const SCOPE_OPTIONS: { value: VouchScope; label: string; description: string; multiplier: string }[] = [
  {
    value: "founder",
    label: "Founder",
    description: "I've worked with them on a venture. Highest weight.",
    multiplier: "1.0x",
  },
  {
    value: "builder",
    label: "Builder",
    description: "They've built with me on a gig or project.",
    multiplier: "0.8x",
  },
  {
    value: "capital",
    label: "Capital partner",
    description: "I've evaluated their venture from a capital perspective.",
    multiplier: "0.6x",
  },
];

export function VouchButton({
  voucheeId,
  currentUserId,
  compact = false,
  className,
}: VouchButtonProps) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<VouchScope>("founder");

  const { data: received = [] } = useVouches(voucheeId);
  const createMut = useCreateVouch(voucheeId);
  const deleteMut = useDeleteVouch(voucheeId);

  // Find the current user's existing vouch for this vouchee (if any).
  const existing: Vouch | undefined = currentUserId
    ? received.find((v) => v.voucherId === currentUserId)
    : undefined;

  const isSelf = !!currentUserId && currentUserId === voucheeId;
  const disabled = isSelf || !currentUserId;

  async function handleConfirm() {
    try {
      await createMut.mutateAsync(scope);
      toast.success(`You vouched this ${scope}.`);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not vouch.");
    }
  }

  async function handleRevoke() {
    if (!existing) return;
    try {
      await deleteMut.mutateAsync(existing.id);
      toast.success("Vouch revoked.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not revoke vouch.");
    }
  }

  if (disabled) {
    return (
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        disabled
        className={cn("gap-1.5", className)}
        title={!currentUserId ? "Sign in to vouch" : isSelf ? "You can't vouch yourself" : undefined}
      >
        <ShieldCheck className="size-4" />
        {isSelf ? "Can't vouch self" : !currentUserId ? "Sign in to vouch" : "Vouch"}
      </Button>
    );
  }

  if (existing) {
    return (
      <Button
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={handleRevoke}
        disabled={deleteMut.isPending}
        className={cn("gap-1.5 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10", className)}
        title="Click to revoke"
      >
        {deleteMut.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}
        Vouched
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="hero"
        size={compact ? "sm" : "default"}
        onClick={() => setOpen(true)}
        className={cn("gap-1.5", className)}
      >
        <ShieldCheck className="size-4" />
        Vouch
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vouch this person</DialogTitle>
            <DialogDescription>
              Your vouch is public and counts toward their Vantage score. It decays 1% every 30 days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScope(opt.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
                  scope === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30",
                )}
              >
                <div className="mt-0.5">
                  <Badge variant={scope === opt.value ? "default" : "outline"}>{opt.multiplier}</Badge>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Confirm vouch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

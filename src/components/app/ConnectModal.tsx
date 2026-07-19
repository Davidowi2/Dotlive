import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { dotApi } from "@/api/client";

interface ConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
  targetUserVantage: number;
  context?: string;
}

export function ConnectModal({ open, onOpenChange, targetUserId, targetUserName, targetUserRole, targetUserVantage, context }: ConnectModalProps) {
  const [reason, setReason] = useState("");
  const [includeMeeting, setIncludeMeeting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 20) {
      toast.error("Please enter a reason (20-500 characters)");
      return;
    }
    if (reason.length > 500) {
      toast.error("Reason must be under 500 characters");
      return;
    }
    setBusy(true);
    try {
      await dotApi.post("/api/connections/request", {
        targetUserId,
        reason: reason.trim(),
        includeMeeting,
      });
      toast.success(`Connection request sent to ${targetUserName}`);
      onOpenChange(false);
      setReason("");
      setIncludeMeeting(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setBusy(false);
    }
  }

  const meta = `${targetUserRole}${targetUserVantage ? ` · Vantage ${targetUserVantage}` : ""}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect with {targetUserName}</DialogTitle>
          <DialogDescription>{context ? `Context: ${context}` : meta}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Reason <span className="text-destructive">*</span></Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Introduce yourself and why you'd like to connect..."
              required
              minLength={20}
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground">{reason.length}/500</p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-meeting"
              checked={includeMeeting}
              onCheckedChange={(checked) => setIncludeMeeting(checked === true)}
            />
            <Label htmlFor="include-meeting" className="text-sm">Also propose a meeting</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="hero" disabled={busy || !reason.trim()}>
              {busy ? "Sending..." : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { PackageCheck, Loader2, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeliveryDialogProps {
  orderId: string | null;
  orderTitle: string;
  onClose: () => void;
  onDeliver: (orderId: string, note: string) => Promise<void>;
}

/**
 * DeliveryDialog
 *
 * Replaces the window.prompt() call in DOT Work SellTab.
 * Builder marks an order as delivered with an optional note
 * or link (e.g. Google Drive, Figma, GitHub).
 */
export function DeliveryDialog({ orderId, orderTitle, onClose, onDeliver }: DeliveryDialogProps) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!orderId) return;
    setBusy(true);
    try {
      await onDeliver(orderId, note.trim());
      setNote("");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setNote("");
      onClose();
    }
  }

  return (
    <Dialog open={!!orderId} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as delivered</DialogTitle>
          <DialogDescription>
            Share your deliverable for: <span className="font-medium text-foreground">{orderTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="delivery-note">Delivery note or link</Label>
            <Textarea
              id="delivery-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a link to your work (Google Drive, Figma, GitHub…) or a note for the client."
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              The client will see this note when confirming delivery.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="hero" onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />}
            Mark delivered
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

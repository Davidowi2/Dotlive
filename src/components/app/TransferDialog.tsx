import { useState } from "react";
import { Send, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { dotApi } from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDot } from "@/lib/constants";
import { toast } from "sonner";

type Step = "details" | "confirm" | "done";

export function TransferDialog({ balance, myDotId }: { balance: number; myDotId?: string | null }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setStep("details");
    setRecipientId("");
    setRecipientName(null);
    setAmount(0);
    setNote("");
    setBusy(false);
  }

  function close(o: boolean) {
    setOpen(o);
    if (!o) setTimeout(reset, 200);
  }

  async function handleLookup() {
    const code = recipientId.trim().toUpperCase();
    if (!code) {
      toast.error("Enter a DOT ID");
      return;
    }
    if (myDotId && code === myDotId.toUpperCase()) {
      toast.error("You cannot transfer to yourself");
      return;
    }
    if (amount <= 0) {
      toast.error("Enter an amount to send");
      return;
    }
    if (amount > balance) {
      toast.error("Amount exceeds your balance");
      return;
    }
    setBusy(true);
    try {
      // Hit the Render backend to look up the recipient's display name
      // by their DOT ID. Backend endpoint: GET /api/users/lookup?dotId=...
      const data = await dotApi.get<{ user: { name: string | null; dotId: string } }>(
        `/api/users/lookup?dotId=${encodeURIComponent(code)}`,
      );
      const user = data?.user;
      if (!user) {
        toast.error("No wallet found for that DOT ID");
        return;
      }
      setRecipientName(user.name ?? user.dotId);
      setStep("confirm");
    } catch (e: any) {
      toast.error(e?.message ?? "Lookup failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleTransfer() {
    setBusy(true);
    try {
      await dotApi.post("/api/wallet/transfer", {
        toDotId: recipientId.trim().toUpperCase(),
        amount: Math.floor(amount),
        description: note.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      setStep("done");
      toast.success(`Sent ${formatDot(amount)} DOT to ${recipientName}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Transfer failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button variant="gold" className="w-full">
          <Send className="size-4" /> Send DOT
        </Button>
      </DialogTrigger>
      <DialogContent>
        {step === "details" && (
          <>
            <DialogHeader>
              <DialogTitle>Send DOT</DialogTitle>
              <DialogDescription>
                Transfer credits instantly to another user by their DOT ID.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="recipient">Recipient DOT ID</Label>
                <Input
                  id="recipient"
                  placeholder="DOT-100042"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="font-mono uppercase"
                  maxLength={20}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (DOT)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  step={1}
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What is this for?"
                  maxLength={120}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Balance: {formatDot(balance)} DOT
              </p>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => close(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleLookup} disabled={busy || !recipientId || amount <= 0}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>Continue <ArrowRight className="size-4" /></>}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm transfer</DialogTitle>
              <DialogDescription>
                You are about to send {formatDot(amount)} DOT to{" "}
                <span className="font-mono font-medium text-foreground">
                  {recipientName}
                </span>
                . This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setStep("details")} disabled={busy}>
                Back
              </Button>
              <Button onClick={handleTransfer} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Confirm"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" /> Transfer complete
              </DialogTitle>
              <DialogDescription>
                {formatDot(amount)} DOT has been sent to {recipientName}.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

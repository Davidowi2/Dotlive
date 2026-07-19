import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
}

export function ReviewModal({ open, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setRating(0);
    setHover(0);
    setComment("");
    setBusy(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit() {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please leave a comment");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ rating, comment: comment.trim() });
      toast.success("Review submitted");
      handleClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit review");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold">Leave a review</h2>
        <p className="mt-1 text-sm text-muted-foreground">Rate your experience with this contract.</p>

        <div className="mt-4 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="rounded-full p-1"
            >
              <Star
                className={`size-6 ${star <= (hover || rating) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">{rating ? `${rating}/5` : "Select rating"}</span>
        </div>

        <Textarea
          className="mt-4"
          rows={4}
          placeholder="Share details about the work, communication, and outcome."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit review"}</Button>
        </div>
      </div>
    </div>
  );
}

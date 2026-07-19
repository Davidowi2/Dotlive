import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Paperclip, Calendar } from "lucide-react";
import { MeetingProposalModal } from "@/components/dot-connect/MeetingProposalModal";

interface MessageComposerProps {
  threadId: string;
  onMessageSent?: (message: { id: string; body: string; createdAt: string }) => void;
}

export function MessageComposer({ threadId, onMessageSent }: MessageComposerProps) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/connections/${encodeURIComponent(threadId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to send");
      }
      const data = await res.json();
      onMessageSent?.(data.message);
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message... (Enter to send)"
          disabled={busy}
          className="min-h-[40px] max-h-[200px] resize-none pr-10"
          rows={1}
        />
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={() => toast.message("Attachments coming soon")} aria-label="Attach">
        <Paperclip className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => setShowMeetingModal(true)} aria-label="Schedule meeting">
        <Calendar className="size-4" />
      </Button>
      <Button type="submit" size="icon" variant="hero" disabled={busy || !text.trim()}>
        {busy ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Send className="size-4" />}
      </Button>

      {showMeetingModal && (
        <MeetingProposalModal
          threadId={threadId}
          onClose={() => setShowMeetingModal(false)}
        />
      )}
    </form>
  );
}

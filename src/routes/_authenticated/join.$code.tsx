import { useEffect, useState } from "react";
import { createFileRoute, useParams, useNavigate, Link } from "@tanstack/react-router";
import { Users, Loader2, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/join/$code")({
  head: () => ({ meta: [{ title: "Join a community — DOT" }] }),
  component: JoinPage,
});

function JoinPage() {
  const { code } = useParams({ from: "/_authenticated/join/$code" });
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "found" | "joined" | "error">("loading");
  const [community, setCommunity] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await dotApi.get<{ community: any }>(`/api/communities/by-referral/${encodeURIComponent(code)}`);
        const match = res?.community;
        if (!match) {
          setStatus("error");
          return;
        }
        setCommunity(match);
        setStatus("found");
      } catch {
        setStatus("error");
      }
    })();
  }, [code]);

  async function join() {
    if (!user || !community) return;
    setBusy(true);
    try {
      await dotApi.post("/api/communities/join", { referralCode: code });
      await dotApi.post("/api/users/me/founder-profile", { communityId: community.id });
      qc.invalidateQueries({ queryKey: ["membership", user.id] });
      setStatus("joined");
      toast.success(`Joined ${community.name}!`);
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not join");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md py-10 text-center">
        {status === "loading" && <Loader2 className="mx-auto size-8 animate-spin text-primary" />}
        {status === "error" && (
          <>
            <h1 className="font-display text-2xl font-bold">Invalid invite</h1>
            <p className="mt-2 text-sm text-muted-foreground">This referral code doesn't exist.</p>
            <Button variant="outline" className="mt-6" asChild>
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </>
        )}
        {status === "found" && community && (
          <>
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-7" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-bold">Join {community.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{community.description}</p>
            <Button variant="hero" className="mt-6" onClick={join} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              Join community
            </Button>
          </>
        )}
        {status === "joined" && (
          <>
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <h1 className="mt-4 font-display text-2xl font-bold">You're in!</h1>
            <p className="mt-2 text-sm text-muted-foreground">Taking you to your dashboard…</p>
          </>
        )}
      </div>
    </AppShell>
  );
}

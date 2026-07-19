import { useEffect, useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users, Plus, Search, Loader2, MessageSquare, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { StatCard } from "@/components/app/StatCard";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  getMyAllCommunities,
  listPublicCommunities,
  createCommunity as createCommunityApi,
  joinByCode,
  type PublicCommunity,
} from "@/api/community";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community — DOT" }] }),
  ssr: false,
  component: CommunityPage,
});

function CommunityPage() {
  const { user } = useDotAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");

  // Queries
  const publicCommunitiesQuery = useQuery({
    queryKey: ["public-communities"],
    queryFn: listPublicCommunities,
    staleTime: 60_000,
  });

  const myCommunitiesQuery = useQuery({
    queryKey: ["my-communities"],
    queryFn: getMyAllCommunities,
    enabled: !!user,
    staleTime: 60_000,
  });

  // Filtered communities
  const filteredCommunities = useMemo(() => {
    const communities = publicCommunitiesQuery.data ?? [];
    if (!searchQuery) return communities;
    const lower = searchQuery.toLowerCase();
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        (c.description?.toLowerCase().includes(lower) ?? false)
    );
  }, [publicCommunitiesQuery.data, searchQuery]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      createCommunityApi(data),
    onSuccess: () => {
      toast.success("Community created!");
      qc.invalidateQueries({ queryKey: ["my-communities"] });
      qc.invalidateQueries({ queryKey: ["public-communities"] });
      setCreateDialogOpen(false);
      setCreateName("");
      setCreateDescription("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create community");
    },
  });

  // Join mutation (using referral code for now)
  const joinMutation = useMutation({
    mutationFn: (code: string) => joinByCode(code),
    onSuccess: () => {
      toast.success("Joined community!");
      qc.invalidateQueries({ queryKey: ["my-communities"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to join community");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    createMutation.mutate({
      name: createName,
      description: createDescription,
    });
  };

  const handleJoin = (community: PublicCommunity) => {
    const referralCode = (community as any).referralCode;
    if (referralCode) {
      joinMutation.mutate(referralCode);
    }
  };

  const myCommunities = myCommunitiesQuery.data ?? [];
  const isLoading = publicCommunitiesQuery.isLoading || myCommunitiesQuery.isLoading;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Community</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Discover groups, join challenges, and engage with founders.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button variant="hero" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" /> Create community
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Community List */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : filteredCommunities.length === 0 ? (
              <EmptyState
                title="No communities yet"
                description="Be the first to create a community!"
                icon={Users}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredCommunities.map((community) => (
                  <Card
                    key={community.id}
                    className="hover:border-primary/30 transition-colors overflow-hidden"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {community.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{community.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {community.memberCount} members
                          </p>
                        </div>
                      </div>
                      {community.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {community.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex gap-2">
                          {myCommunities.some((c) => c.id === community.id) ? (
                            <Badge variant="secondary">Joined</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJoin(community)}
                              disabled={joinMutation.isPending}
                            >
                              Join
                            </Button>
                          )}
                        </div>
                        {myCommunities.some((c) => c.id === community.id) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate({ to: "/community/channels" })}
                          >
                            <MessageSquare className="size-4 mr-1" />
                            Open
                            <ArrowRight className="size-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Your Communities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Your Communities</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {myCommunitiesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin text-primary" />
                  </div>
                ) : myCommunities.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    You haven't joined any communities yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {myCommunities.map((community) => (
                      <div
                        key={community.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate({ to: "/community/channels" })}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                          {community.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{community.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trending (placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Trending</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  Discover communities to join from the Discover page.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Community Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Community</DialogTitle>
            <DialogDescription>
              Start a new community for founders to connect and collaborate.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Community Name</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g., Lagos Founders"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Tell us what your community is about..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !createName.trim()}>
                {createMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

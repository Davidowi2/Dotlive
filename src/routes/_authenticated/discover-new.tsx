import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, MessageCircle, Bookmark, Plus } from "lucide-react";
import { dotApi } from "@/api/client";
import { toast } from "sonner";

// Simple types - no complex nesting
interface FeedPost {
  id: string;
  type: "gig" | "announcement" | "venture_update" | "funding" | "general";
  title: string | null;
  body: string;
  authorId: string;
  authorName: string;
  authorDotId: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

// API functions - simple, direct calls
async function getFeed(tab: "latest" | "popular" | "trending" = "latest") {
  const res = await dotApi.get<{ posts: FeedPost[]; hasMore: boolean; total: number }>(
    `/api/feed?tab=${tab}&page=1&limit=20`
  );
  return res.posts || [];
}

async function createPost(body: string, type: "gig" | "general" = "general") {
  // CRITICAL FIX: Pass tags as an array, not stringified
  const res = await dotApi.post<{ post: FeedPost }>("/api/feed", {
    type,
    body,
    tags: [], // Empty array - let database handle it
  });
  return res.post;
}

async function toggleLike(postId: string) {
  const res = await dotApi.post<{ liked: boolean; likesCount: number }>(`/api/feed/${postId}/like`, {});
  return res;
}

async function addComment(postId: string, body: string) {
  const res = await dotApi.post<{ comment: { id: string; body: string } }>(`/api/feed/${postId}/comments`, {
    body,
  });
  return res.comment;
}

// Main component
function DiscoverPage() {
  const qc = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<"latest" | "popular" | "trending">("latest");
  const [newPostBody, setNewPostBody] = useState("");
  const [newCommentBody, setNewCommentBody] = useState<{ [key: string]: string }>({});
  const [openCommentPost, setOpenCommentPost] = useState<string | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  // Fetch feed
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["feed", selectedTab],
    queryFn: () => getFeed(selectedTab),
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (body: string) => createPost(body),
    onSuccess: () => {
      toast.success("Post created!");
      setNewPostBody("");
      setIsPostDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err) => {
      console.error("Create post error:", err);
      toast.error("Failed to create post");
    },
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: (postId: string) => toggleLike(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => {
      toast.error("Failed to like post");
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) => addComment(postId, body),
    onSuccess: (_, variables) => {
      toast.success("Comment added!");
      setNewCommentBody((prev) => ({ ...prev, [variables.postId]: "" }));
      setOpenCommentPost(null);
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const handleCreatePost = useCallback(() => {
    if (!newPostBody.trim()) {
      toast.error("Post cannot be empty");
      return;
    }
    createPostMutation.mutate(newPostBody);
  }, [newPostBody]);

  const handleAddComment = useCallback(
    (postId: string) => {
      const body = newCommentBody[postId];
      if (!body?.trim()) {
        toast.error("Comment cannot be empty");
        return;
      }
      commentMutation.mutate({ postId, body });
    },
    [newCommentBody]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Discover</h1>
              <p className="text-sm text-muted-foreground">Connect with gigs, opportunities, and ideas</p>
            </div>
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a Post</DialogTitle>
                  <DialogDescription>Share an update with the community</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPostBody}
                    onChange={(e) => setNewPostBody(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button
                    onClick={handleCreatePost}
                    disabled={createPostMutation.isPending || !newPostBody.trim()}
                    className="w-full"
                  >
                    {createPostMutation.isPending ? "Creating..." : "Post"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-2">
            {(["latest", "popular", "trending"] as const).map((tab) => (
              <Button
                key={tab}
                variant={selectedTab === tab ? "default" : "outline"}
                onClick={() => setSelectedTab(tab)}
                className="capitalize"
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-muted" />
                <CardContent className="h-24 bg-muted" />
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">Error loading feed</CardTitle>
              <CardDescription>{error instanceof Error ? error.message : "Something went wrong"}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Posts list */}
        {!isLoading && posts.length === 0 && (
          <Card>
            <CardContent className="flex min-h-40 items-center justify-center text-center">
              <div>
                <p className="text-muted-foreground">No posts yet</p>
                <Button variant="link" onClick={() => setIsPostDialogOpen(true)} className="mt-2">
                  Be the first to post
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-2 text-lg">{post.title || post.body.substring(0, 50)}</CardTitle>
                    <CardDescription className="text-xs">
                      {post.authorName} • {new Date(post.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {post.type}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="line-clamp-3 text-sm text-foreground">{post.body}</p>

                {/* Post actions */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => likeMutation.mutate(post.id)}
                    disabled={likeMutation.isPending}
                  >
                    <Heart className={`h-4 w-4 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    {post.likesCount}
                  </Button>

                  <Dialog open={openCommentPost === post.id} onOpenChange={(open) => setOpenCommentPost(open ? post.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        <MessageCircle className="h-4 w-4" />
                        {post.commentsCount}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Comment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="What do you think?"
                          value={newCommentBody[post.id] || ""}
                          onChange={(e) =>
                            setNewCommentBody((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          className="min-h-[80px]"
                        />
                        <Button
                          onClick={() => handleAddComment(post.id)}
                          disabled={
                            commentMutation.isPending || !newCommentBody[post.id]?.trim()
                          }
                          className="w-full"
                        >
                          {commentMutation.isPending ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="ghost" size="sm" className="gap-1 text-xs ml-auto">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/discover-new")({
  component: DiscoverPage,
});

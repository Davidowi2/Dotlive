import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  Loader,
  Search,
  ShieldAlert,
  Wallet,
  Activity,
  Ban,
  Unlock,
  Trash2,
  Megaphone,
  FileText,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminStats,
  useAdminUsers,
  useAdminUser,
  useBanUser,
  useUnbanUser,
  useAdminFeedPosts,
  useDeleteFeedPost,
} from "@/hooks/use-admin";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useRoleGate } from "@/hooks/use-role-gate";
import { formatDot } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/operator")({
  head: () => ({
    meta: [
      { title: "Operator Dashboard — DOT" },
      { name: "description", content: "Platform administration and oversight." },
    ],
  }),
  component: OperatorPage,
});

function OperatorPage() {
  const { user } = useDotAuth();
  const gate = useRoleGate(["admin", "super_admin"], { redirect: "/dashboard" });

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "feed" | "announcements">("users");
  const [feedSearch, setFeedSearch] = useState("");
  const [feedTypeFilter, setFeedTypeFilter] = useState<string>("");
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");

  // Hooks
  const { stats, isLoading: statsLoading } = useAdminStats();
  const { users, isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers(searchQuery || undefined);
  const { user: selectedUser, isLoading: userLoading } = useAdminUser(selectedUserId);
  const { ban, isPending: banPending } = useBanUser();
  const { unban, isPending: unbanPending } = useUnbanUser();
  const { posts, isLoading: feedLoading, refetch: refetchFeed } = useAdminFeedPosts(feedSearch || undefined, feedTypeFilter || undefined);
  const { deletePost, isPending: deletePending } = useDeleteFeedPost();

  if (!gate.allowed) {
    return (
      <AppShell>
        <div className="p-12 text-center">
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="mt-2 text-muted-foreground">You need admin or operator role to access this page.</p>
        </div>
      </AppShell>
    );
  }

  const handleBanClick = () => {
    if (!banReason.trim() || banReason.length < 8) {
      toast.error("Ban reason must be at least 8 characters");
      return;
    }

    if (selectedUserId === user?.id) {
      toast.error("You cannot ban yourself");
      return;
    }

    ban(
      { userId: selectedUserId!, reason: banReason },
      {
        onSuccess: () => {
          setShowBanDialog(false);
          setBanReason("");
          setSelectedUserId(null);
        },
      }
    );
  };

  const handleUnbanClick = () => {
    if (!selectedUserId) return;

    unban(
      { userId: selectedUserId, reason: "Unbanned by operator" },
      {
        onSuccess: () => {
          setSelectedUserId(null);
        },
      }
    );
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration"
        title="Operator Dashboard"
        subtitle="Manage users, monitor platform activity, and maintain system health."
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          <div className="col-span-4 flex justify-center">
            <Loader className="animate-spin h-8 w-8" />
          </div>
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={stats?.users?.toLocaleString() || "0"}
              icon={Users}
              accent="primary"
            />
            <StatCard
              label="Ventures"
              value={stats?.ventures?.toLocaleString() || "0"}
              icon={Activity}
              accent="muted"
            />
            <StatCard
              label="DOT in Circulation"
              value={formatDot(Number(stats?.dotInCirculation) || 0)}
              icon={Wallet}
              accent="primary"
            />
            <StatCard
              label="Beta Mode"
              value={stats?.isBeta ? "Active" : "Inactive"}
              icon={ShieldAlert}
              accent={stats?.isBeta ? "gold" : "muted"}
            />
          </>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === "users" ? "default" : "outline"}
          onClick={() => setActiveTab("users")}
        >
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
        <Button
          variant={activeTab === "feed" ? "default" : "outline"}
          onClick={() => setActiveTab("feed")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Feed
        </Button>
        <Button
          variant={activeTab === "announcements" ? "default" : "outline"}
          onClick={() => setActiveTab("announcements")}
        >
          <Megaphone className="h-4 w-4 mr-2" />
          Announcements
        </Button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </h2>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users table */}
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin h-8 w-8" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Roles</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50 transition">
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">{u.name || "—"}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map((r) => (
                              <Badge key={r} variant="outline" className="text-xs">
                                {r}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.bannedAt ? (
                          <Badge variant="destructive" className="text-xs">
                            <Ban className="h-3 w-3 mr-1" />
                            Banned
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUserId(u.id)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Feed Moderation Tab */}
      {activeTab === "feed" && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Feed Moderation
          </h2>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={feedTypeFilter}
              onChange={(e) => setFeedTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-border bg-card text-sm"
            >
              <option value="">All types</option>
              <option value="gig">Gig</option>
              <option value="announcement">Announcement</option>
              <option value="venture_update">Venture Update</option>
              <option value="funding">Funding</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Posts list */}
          {feedLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No posts found</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start justify-between p-4 rounded-lg border border-border bg-card"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {post.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {post.author_name || post.author_dot_id || "Unknown"} •{" "}
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {post.title && (
                      <p className="font-medium truncate">{post.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.body}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>❤️ {post.likes_count}</span>
                      <span>💬 {post.comments_count}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePost(post.id)}
                    disabled={deletePending}
                    className="ml-4 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Announcements Tab */}
      {activeTab === "announcements" && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Post Announcement
            </h2>
            <Button onClick={() => setShowAnnouncementDialog(true)}>
              <Megaphone className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </div>

          <p className="text-muted-foreground mb-4">
            Post announcements that will appear in the Discover feed for all users to see.
          </p>

          <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Click "New Announcement" to create a post that will be visible to all users in the Discover feed.
            </p>
          </div>
        </Card>
      )}

      {/* User details dialog */}
      {activeTab === "users" && (
        <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View and manage user information</DialogDescription>
            </DialogHeader>

            {userLoading ? (
              <div className="flex justify-center py-8">
                <Loader className="animate-spin h-8 w-8" />
              </div>
            ) : selectedUser ? (
              <div className="space-y-6">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedUser.name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">DOT ID</Label>
                    <p className="font-medium text-sm">{selectedUser.dotId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p className="font-medium text-sm">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Roles and status */}
                <div>
                  <Label className="text-xs text-muted-foreground">Roles</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedUser.roles && selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((r) => (
                        <Badge key={r} variant="outline">
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No roles assigned</span>
                    )}
                  </div>
                </div>

                {/* Wallet info */}
                {selectedUser.wallet && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Wallet Balance</Label>
                    <p className="font-medium">{formatDot(Number(selectedUser.wallet.balance))} DOT</p>
                  </div>
                )}

                {/* Ban status */}
                {selectedUser.ban && (
                  <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">User is banned</p>
                        <p className="text-xs text-muted-foreground">{selectedUser.ban.reason}</p>
                      </div>
                      {selectedUser.ban.expiresAt && (
                        <Badge variant="outline" className="text-xs">
                          Expires:{" "}
                          {new Date(selectedUser.ban.expiresAt).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUnbanClick}
                      disabled={unbanPending}
                    >
                      <Unlock className="h-3 w-3 mr-1" />
                      Unban
                    </Button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  {!selectedUser.ban && user?.id !== selectedUserId && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBanDialog(true)}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Ban User
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      )}

      {/* Ban dialog */}
      {activeTab === "users" && (
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Provide a reason for banning this user. This action cannot be undone immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ban-reason">Reason for ban *</Label>
                <Textarea
                  id="ban-reason"
                  placeholder="Explain why this user is being banned (minimum 8 characters)"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {banReason.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBanDialog(false);
                    setBanReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBanClick}
                  disabled={banPending || banReason.length < 8}
                >
                  {banPending && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Ban
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Announcement</DialogTitle>
            <DialogDescription>
              This announcement will appear in the Discover feed for all users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="announcement-title">Title (optional)</Label>
              <Input
                id="announcement-title"
                placeholder="Enter a title..."
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="announcement-body">Message *</Label>
              <Textarea
                id="announcement-body"
                placeholder="Write your announcement..."
                value={announcementBody}
                onChange={(e) => setAnnouncementBody(e.target.value)}
                rows={5}
                className="mt-2"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAnnouncementDialog(false);
                  setAnnouncementTitle("");
                  setAnnouncementBody("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!announcementBody.trim()) {
                    toast.error("Please enter a message");
                    return;
                  }
                  try {
                    const res = await fetch("/api/feed", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        type: "announcement",
                        title: announcementTitle || null,
                        body: announcementBody,
                        tags: [],
                      }),
                    });
                    if (!res.ok) {
                      const err = await res.json();
                      throw new Error(err.error || "Failed to post");
                    }
                    toast.success("Announcement posted!");
                    setShowAnnouncementDialog(false);
                    setAnnouncementTitle("");
                    setAnnouncementBody("");
                    if (activeTab === "feed") refetchFeed();
                  } catch (e: unknown) {
                    const err = e as Error;
                    toast.error(err.message || "Failed to post announcement");
                  }
                }}
                disabled={!announcementBody.trim()}
              >
                Post Announcement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
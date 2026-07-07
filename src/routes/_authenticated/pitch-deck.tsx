import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Share2, Trash2, Edit2, Plus, Loader, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePitchDecks, useCreatePitchDeck, useUpdatePitchDeck, useDeletePitchDeck } from "@/hooks/use-pitch";
import { useFounderProfile } from "@/hooks/use-dot-data";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { toast } from "sonner";
import type { PitchDeck } from "@/api/pitch";

export const Route = createFileRoute("/_authenticated/pitch-deck")({
  head: () => ({
    meta: [
      { title: "Pitch Decks — DOT" },
      { name: "description", content: "Manage and share your venture pitch decks." },
    ],
  }),
  component: PitchDeckPage,
});

function PitchDeckPage() {
  const { decks, loading, error, refetch } = usePitchDecks();
  const { create, loading: createLoading } = useCreatePitchDeck();
  const { update, loading: updateLoading } = useUpdatePitchDeck();
  const { delete: deleteDeck, loading: deleteLoading } = useDeletePitchDeck();
  const { data: founder } = useFounderProfile();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<PitchDeck | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form state for creating new deck
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    url: "",
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    url: "",
    isPublic: false,
  });

  const handleCreateSubmit = useCallback(async () => {
    if (!createForm.title || !createForm.url) {
      toast.error("Please fill in title and URL");
      return;
    }

    // Validate URL
    try {
      new URL(createForm.url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      // Get user's first venture ID from founder profile
      const ventureId = (founder as any)?.id;
      if (!ventureId) {
        toast.error("No venture found. Please create a venture first.");
        return;
      }

      await create({
        ventureId,
        title: createForm.title,
        description: createForm.description || undefined,
        url: createForm.url,
      });
      toast.success("Pitch deck created!");
      setShowCreateModal(false);
      setCreateForm({ title: "", description: "", url: "" });
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create pitch deck");
    }
  }, [createForm, create, refetch, founder]);

  const handleEditClick = (deck: PitchDeck) => {
    setEditingDeck(deck);
    setEditForm({
      title: deck.title,
      description: deck.description || "",
      url: deck.url,
      isPublic: deck.isPublic,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = useCallback(async () => {
    if (!editingDeck || !editForm.title || !editForm.url) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate URL
    try {
      new URL(editForm.url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      await update(editingDeck.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        url: editForm.url,
        isPublic: editForm.isPublic,
      });
      toast.success("Pitch deck updated!");
      setShowEditModal(false);
      setEditingDeck(null);
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update pitch deck");
    }
  }, [editingDeck, editForm, update, refetch]);

  const handleDelete = useCallback(
    async (deckId: string) => {
      if (!confirm("Are you sure you want to delete this pitch deck?")) return;

      try {
        await deleteDeck(deckId);
        toast.success("Pitch deck deleted!");
        await refetch();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete pitch deck");
      }
    },
    [deleteDeck, refetch]
  );

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Demo"
        title="Pitch Decks"
        subtitle="Upload and manage your venture pitch decks. Share with investors and use in pitchathons."
      />

      {error && (
        <Alert className="mt-6 border-red-200 bg-red-50 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {decks.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No pitch decks yet"
          subtitle="Create your first pitch deck to start sharing with investors and competing in pitchathons."
          action={{ label: "Create Your First Deck", onClick: () => setShowCreateModal(true) }}
        />
      ) : (
        <>
          <div className="mb-6 flex justify-end">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Pitch Deck
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Card key={deck.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold line-clamp-2">
                      {deck.title}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-2 ${
                        deck.isPublic
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {deck.isPublic ? "Public" : "Private"}
                    </span>
                  </div>

                  {deck.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {deck.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium">Version:</span> {deck.version}
                    </p>
                    <p className="text-muted-foreground break-all">
                      <span className="font-medium">URL:</span>{" "}
                      <a
                        href={deck.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {new URL(deck.url).hostname}
                      </a>
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Updated {new Date(deck.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="p-6 border-t border-border flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(deck.url)}
                    className="flex-1"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(deck)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(deck.id)}
                    disabled={deleteLoading}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create Deck Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Pitch Deck</DialogTitle>
            <DialogDescription>
              Add a new pitch deck to showcase your venture to investors
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Series A Pitch Deck"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                placeholder="Brief description of this pitch deck"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="url">PDF/Presentation URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/pitch-deck.pdf"
                value={createForm.url}
                onChange={(e) =>
                  setCreateForm({ ...createForm, url: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={createLoading}
              >
                {createLoading ? (
                  <>
                    <Loader className="h-3 w-3 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Deck"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Deck Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pitch Deck</DialogTitle>
            <DialogDescription>Update your pitch deck details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                placeholder="Brief description of this pitch deck"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-url">PDF/Presentation URL *</Label>
              <Input
                id="edit-url"
                type="url"
                value={editForm.url}
                onChange={(e) =>
                  setEditForm({ ...editForm, url: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isPublic"
                checked={editForm.isPublic}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, isPublic: checked })
                }
              />
              <Label htmlFor="isPublic">Make public</Label>
              <span className="text-xs text-muted-foreground">
                (anyone with the link can view)
              </span>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <>
                    <Loader className="h-3 w-3 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

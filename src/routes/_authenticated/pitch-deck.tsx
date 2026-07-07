import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Share2, Trash2, Edit2, Plus, Loader } from "lucide-react";
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
import type { PitchDeck } from "@/api/pitch";

function PitchDeckPage() {
  const { decks, loading, error, refetch } = usePitchDecks();
  const { create, loading: createLoading } = useCreatePitchDeck();
  const { update, loading: updateLoading } = useUpdatePitchDeck();
  const { delete: deleteDeck, loading: deleteLoading } = useDeletePitchDeck();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<PitchDeck | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form state for creating new deck
  const [createForm, setCreateForm] = useState({
    ventureId: "",
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
    if (!createForm.ventureId || !createForm.title || !createForm.url) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await create({
        ventureId: createForm.ventureId,
        title: createForm.title,
        description: createForm.description || undefined,
        url: createForm.url,
      });
      setShowCreateModal(false);
      setCreateForm({ ventureId: "", title: "", description: "", url: "" });
      await refetch();
    } catch (err) {
      console.error("Failed to create pitch deck:", err);
    }
  }, [createForm, create, refetch]);

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
      alert("Please fill in all required fields");
      return;
    }

    try {
      await update(editingDeck.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        url: editForm.url,
        isPublic: editForm.isPublic,
      });
      setShowEditModal(false);
      setEditingDeck(null);
      await refetch();
    } catch (err) {
      console.error("Failed to update pitch deck:", err);
    }
  }, [editingDeck, editForm, update, refetch]);

  const handleDelete = useCallback(
    async (deckId: string) => {
      if (!confirm("Are you sure you want to delete this pitch deck?")) return;

      try {
        await deleteDeck(deckId);
        await refetch();
      } catch (err) {
        console.error("Failed to delete pitch deck:", err);
      }
    },
    [deleteDeck, refetch]
  );

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center h-96">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pitch Decks</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage your venture pitch decks and share them with investors
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Pitch Deck
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {decks.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No pitch decks yet
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Create your first pitch deck to start sharing with investors and competing in pitchathons.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>Create Your First Deck</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Card key={deck.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                {/* Card Header */}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">
                      {deck.title}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        deck.isPublic
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {deck.isPublic ? "Public" : "Private"}
                    </span>
                  </div>

                  {deck.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                      {deck.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Version:</span> {deck.version}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 break-all">
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
                    <p className="text-slate-500 dark:text-slate-500 text-xs">
                      Updated {new Date(deck.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-2">
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
        )}
      </div>

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
              <Label>Venture ID *</Label>
              <Input
                type="text"
                placeholder="Enter venture UUID"
                value={createForm.ventureId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, ventureId: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                type="text"
                placeholder="e.g., Series A Pitch Deck"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this pitch deck"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label>URL *</Label>
              <Input
                type="url"
                placeholder="https://example.com/pitch-deck"
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
              <Label>Title *</Label>
              <Input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this pitch deck"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label>URL *</Label>
              <Input
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
              <span className="text-xs text-slate-500">
                (Public decks can be viewed by anyone with the link)
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
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/pitch-deck")({
  component: PitchDeckPage,
});

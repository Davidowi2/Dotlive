import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  uploadBuilderDocument,
  listMyDocuments,
  deleteDocument,
  type CreateDocumentInput,
} from "@/api/builderDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, Trash2, Plus, FileText } from "lucide-react";
import { toast } from "sonner";

export function BuilderDocumentsForm() {
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateDocumentInput>({
    type: "cv",
    title: "",
    description: "",
    fileUrl: "",
    fileName: "",
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["builder-documents"],
    queryFn: listMyDocuments,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadBuilderDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["builder-documents"] });
      toast.success("Document uploaded!");
      setFormData({ type: "cv", title: "", description: "", fileUrl: "", fileName: "" });
      setIsOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to upload");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["builder-documents"] });
      toast.success("Document deleted");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.fileUrl) {
      toast.error("Title and file URL required");
      return;
    }
    uploadMutation.mutate(formData);
  };

  const typeLabels = {
    cv: "CV / Resume",
    certificate: "Certificate",
    project: "Project",
    sample: "Work Sample",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Portfolio Documents</h3>
        <Button
          size="sm"
          variant="default"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Document
        </Button>
      </div>

      {isOpen && (
        <Card className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md"
                >
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., AWS Solutions Architect Cert"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this document..."
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL</Label>
              <Input
                id="fileUrl"
                type="url"
                placeholder="https://example.com/document.pdf"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Provide a URL to the document (S3, Google Drive, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileName">File Name (optional)</Label>
              <Input
                id="fileName"
                placeholder="e.g., aws-certificate.pdf"
                value={formData.fileName || ""}
                onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={uploadMutation.isPending}
                className="gap-2"
              >
                {uploadMutation.isPending && <Loader className="h-4 w-4 animate-spin" />}
                Upload Document
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 flex items-start justify-between">
              <div className="flex gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 mt-1 flex-shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{doc.title}</p>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {typeLabels[doc.type as keyof typeof typeLabels]}
                    </Badge>
                    {doc.isVerified && (
                      <Badge className="text-xs bg-green-100 text-green-800">
                        Verified
                      </Badge>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {doc.fileName} • {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteDocument(doc.id)}
                disabled={deleteMutation.isPending}
                className="flex-shrink-0 ml-2"
              >
                {deleteMutation.isPending ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </Card>
          ))}
        </div>
      ) : !isOpen ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No documents yet. Add your CV, certifications, and work samples to stand out.
        </p>
      ) : null}
    </div>
  );
}

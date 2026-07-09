import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCertification,
  listMyCertifications,
  deleteCertification,
  type CreateCertificationInput,
} from "@/api/builderDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, Trash2, Plus, Award } from "lucide-react";
import { toast } from "sonner";

export function BuilderCertificationsForm() {
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCertificationInput>({
    name: "",
    issuer: "",
    issuedDate: "",
    expiresDate: "",
    credentialUrl: "",
    credentialId: "",
    badgeUrl: "",
  });

  const { data: certs = [] } = useQuery({
    queryKey: ["builder-certifications"],
    queryFn: listMyCertifications,
  });

  const addMutation = useMutation({
    mutationFn: addCertification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["builder-certifications"] });
      toast.success("Certification added!");
      setFormData({
        name: "",
        issuer: "",
        issuedDate: "",
        expiresDate: "",
        credentialUrl: "",
        credentialId: "",
        badgeUrl: "",
      });
      setIsOpen(false);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add certification");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCertification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["builder-certifications"] });
      toast.success("Certification deleted");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.issuer) {
      toast.error("Name and issuer required");
      return;
    }
    addMutation.mutate(formData);
  };

  const isExpired = (expiresDate?: string) => {
    if (!expiresDate) return false;
    return new Date(expiresDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Certifications & Credentials</h3>
        <Button
          size="sm"
          variant="default"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Certification
        </Button>
      </div>

      {isOpen && (
        <Card className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Certification Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., AWS Solutions Architect"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer *</Label>
                <Input
                  id="issuer"
                  placeholder="e.g., Amazon Web Services"
                  value={formData.issuer}
                  onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuedDate">Issued Date (optional)</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  value={formData.issuedDate || ""}
                  onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresDate">Expires (optional)</Label>
                <Input
                  id="expiresDate"
                  type="date"
                  value={formData.expiresDate || ""}
                  onChange={(e) => setFormData({ ...formData, expiresDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentialUrl">Credential URL (optional)</Label>
              <Input
                id="credentialUrl"
                type="url"
                placeholder="https://example.com/verify/..."
                value={formData.credentialUrl || ""}
                onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentialId">Credential ID (optional)</Label>
              <Input
                id="credentialId"
                placeholder="Reference number or ID"
                value={formData.credentialId || ""}
                onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badgeUrl">Badge Image URL (optional)</Label>
              <Input
                id="badgeUrl"
                type="url"
                placeholder="https://example.com/badge.png"
                value={formData.badgeUrl || ""}
                onChange={(e) => setFormData({ ...formData, badgeUrl: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={addMutation.isPending}
                className="gap-2"
              >
                {addMutation.isPending && <Loader className="h-4 w-4 animate-spin" />}
                Add Certification
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

      {certs.length > 0 ? (
        <div className="space-y-3">
          {certs.map((cert) => {
            const expired = isExpired(cert.expiresDate);
            return (
              <Card
                key={cert.id}
                className={`p-4 flex items-start justify-between ${
                  expired ? "opacity-60 bg-muted/50" : ""
                }`}
              >
                <div className="flex gap-3 flex-1 min-w-0">
                  <Award className="h-5 w-5 mt-1 flex-shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium">{cert.name}</p>
                      {cert.isVerified && (
                        <Badge className="text-xs bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                      {expired && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-2">
                      {cert.issuedDate && (
                        <span>Issued: {new Date(cert.issuedDate).toLocaleDateString()}</span>
                      )}
                      {cert.expiresDate && (
                        <span>
                          Expires: {new Date(cert.expiresDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        View Credential →
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteCertification(cert.id)}
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
            );
          })}
        </div>
      ) : !isOpen ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No certifications yet. Add your credentials to boost your credibility.
        </p>
      ) : null}
    </div>
  );
}

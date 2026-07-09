/**
 * Builder Documents API — portfolio uploads, certifications, vouches
 * Endpoints for managing builder profile documents and credentials
 */

import { dotApi } from "./client";
import type { BuilderDocument, BuilderCertification, BuilderVouch } from "@shared/types";

/* ──────────────────── Documents ──────────────────── */

export interface CreateDocumentInput {
  type: "cv" | "certificate" | "project" | "sample";
  title: string;
  description?: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  displayOrder?: number;
}

export async function uploadBuilderDocument(doc: CreateDocumentInput): Promise<BuilderDocument> {
  const response = await dotApi.post<{ document: BuilderDocument }>(
    "/api/users/me/builder-documents",
    doc
  );
  return response.document;
}

export async function listMyDocuments(): Promise<BuilderDocument[]> {
  const response = await dotApi.get<{ documents: BuilderDocument[] }>(
    "/api/users/me/builder-documents"
  );
  return response.documents || [];
}

export async function deleteDocument(id: string): Promise<void> {
  await dotApi.delete(`/api/users/me/builder-documents/${id}`);
}

export async function getBuilderDocuments(builderId: string): Promise<BuilderDocument[]> {
  const response = await dotApi.get<{ documents: BuilderDocument[] }>(
    `/api/builders/${builderId}/documents`
  );
  return response.documents || [];
}

/* ──────────────────── Certifications ──────────────────── */

export interface CreateCertificationInput {
  name: string;
  issuer: string;
  issuedDate?: string; // YYYY-MM-DD
  expiresDate?: string; // YYYY-MM-DD
  credentialUrl?: string;
  credentialId?: string;
  badgeUrl?: string;
}

export async function addCertification(cert: CreateCertificationInput): Promise<BuilderCertification> {
  const response = await dotApi.post<{ certification: BuilderCertification }>(
    "/api/users/me/builder-certifications",
    cert
  );
  return response.certification;
}

export async function listMyCertifications(): Promise<BuilderCertification[]> {
  const response = await dotApi.get<{ certifications: BuilderCertification[] }>(
    "/api/users/me/builder-certifications"
  );
  return response.certifications || [];
}

export async function deleteCertification(id: string): Promise<void> {
  await dotApi.delete(`/api/users/me/builder-certifications/${id}`);
}

export async function getBuilderCertifications(builderId: string): Promise<BuilderCertification[]> {
  const response = await dotApi.get<{ certifications: BuilderCertification[] }>(
    `/api/builders/${builderId}/certifications`
  );
  return response.certifications || [];
}

/* ──────────────────── Vouches ──────────────────── */

export interface VouchInput {
  skill: string;
  comment?: string;
  isEndorsed?: boolean;
}

export interface VouchSummary {
  total: number;
  bySkill: Array<{
    skill: string;
    count: number;
    endorsed: number;
  }>;
}

export async function vouchForBuilder(builderId: string, vouch: VouchInput): Promise<BuilderVouch> {
  const response = await dotApi.post<{ vouch: BuilderVouch }>(
    `/api/users/${builderId}/vouch`,
    vouch
  );
  return response.vouch;
}

export async function getBuilderVouches(builderId: string): Promise<VouchSummary> {
  const response = await dotApi.get<VouchSummary>(
    `/api/users/${builderId}/vouches`
  );
  return response;
}

import { getToken } from "./client";
import { ApiError } from "@/types/api";

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://dotlive-api.onrender.com";

/**
 * Upload an image file (avatar, logo, etc.) via the backend.
 * Returns the Cloudinary secure URL.
 */
export async function uploadImage(file: File, folder = "avatars"): Promise<string> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${BASE_URL}/api/upload/image?folder=${encodeURIComponent(folder)}`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      (body as { error?: string }).error ?? "Upload failed",
      res.status
    );
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}

/**
 * Upload a document (PDF, pitch deck, etc.) via the backend.
 * Returns the Cloudinary secure URL.
 */
export async function uploadDocument(file: File, folder = "documents"): Promise<string> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(
    `${BASE_URL}/api/upload/document?folder=${encodeURIComponent(folder)}`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      (body as { error?: string }).error ?? "Upload failed",
      res.status
    );
  }

  const data = (await res.json()) as { url: string };
  return data.url;
}

export async function uploadPitchDeck(file: File): Promise<string> {
  return uploadDocument(file, "pitch-decks");
}

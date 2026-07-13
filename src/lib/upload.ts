/**
 * Upload helpers — Cloudinary only.
 *
 * Direct Supabase Storage uploads were removed. Use /api/upload/*
 * or the sign+upload flow in src/api/upload.ts instead.
 */

export type CloudinarySignResp = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
};

export async function signCloudinaryImageUpload(
  folder: "avatars" | "ventures" | "services" | "community" | "misc" | "feed",
  userId: string,
): Promise<CloudinarySignResp> {
  const res = await fetch(
    `/api/upload/sign?folder=${encodeURIComponent(folder)}`,
    {
      headers: { accept: "application/json" },
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sign upload failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as CloudinarySignResp;
  data.folder = `dotlive/${folder}/${userId}`;
  return data;
}

export async function uploadImageToCloudinary(
  file: File,
  folder: "avatars" | "ventures" | "services" | "community" | "misc" | "feed",
  userId: string,
): Promise<{ url: string; publicId: string }> {
  const sign = await signCloudinaryImageUpload(folder, userId);
  const form = new FormData();
  form.set("file", file);
  form.set("api_key", sign.apiKey);
  form.set("timestamp", String(sign.timestamp));
  form.set("signature", sign.signature);
  form.set("folder", sign.folder);

  const uploadRes = await fetch(sign.uploadUrl, { method: "POST", body: form });
  if (!uploadRes.ok) {
    const text = await uploadRes.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${uploadRes.status} ${text}`);
  }
  const json = (await uploadRes.json()) as {
    secure_url: string;
    public_id: string;
  };
  return { url: json.secure_url, publicId: json.public_id };
}

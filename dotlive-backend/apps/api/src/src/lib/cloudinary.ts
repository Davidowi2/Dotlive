/**
 * Cloudinary integration.
 *
 * Per the deployment decision: images are uploaded directly from
 * the frontend using a signed payload returned by
 * `signDirectUpload()`; documents (PDF, etc.) go through the
 * backend via `uploadDocument()`.
 */

import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

let configured = false;

export function isCloudinaryConfigured(): boolean {
  return !!(cloudName && apiKey && apiSecret);
}

function ensureConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your env."
    );
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    configured = true;
  }
}

/**
 * Build a signed payload the frontend can POST directly to
 * Cloudinary's `/v1_1/<cloud>/auto/upload` endpoint.
 *
 * Params reference:
 * https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 */
export async function signDirectUpload(opts: {
  folder: string;
  userId: string;
}): Promise<{
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
}> {
  ensureConfigured();
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder: `dotlive/${opts.folder}`,
    timestamp,
    // Public_id prefix so we can find the file later
    // (Cloudinary will append a random suffix).
  };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret!);
  return {
    cloudName: cloudName!,
    apiKey: apiKey!,
    timestamp,
    signature,
    folder: `dotlive/${opts.folder}`,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  };
}

/**
 * Upload a document (PDF, etc.) via the backend. Used for
 * pitch decks and any non-image asset.
 */
export async function uploadDocument(
  buffer: Buffer,
  folder: string,
  filename?: string
): Promise<{ url: string; publicId: string; bytes: number }> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `dotlive/${folder}`,
        resource_type: "raw",
        public_id: filename,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result!.secure_url,
          publicId: result!.public_id,
          bytes: result!.bytes,
        });
      }
    );
    stream.end(buffer);
  });
}

export async function uploadImage(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `dotlive/${folder}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result!.secure_url,
          publicId: result!.public_id,
          width: result!.width,
          height: result!.height,
        });
      }
    );
    stream.end(buffer);
  });
}
// @ts-nocheck
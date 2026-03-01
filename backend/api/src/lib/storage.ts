/**
 * storage.ts
 * Supabase Storage helpers for uploading and generating signed URLs.
 * Bucket: "staging-outputs"  (create it manually in Supabase dashboard — private)
 */
import { createClient } from "./supabase";

const BUCKET = "staging-outputs";
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour for previews

/**
 * Upload a buffer to Supabase Storage.
 * Returns the storage path (key) used.
 */
export async function uploadBuffer(
  buffer: Buffer,
  storagePath: string,
  contentType: "image/png" | "image/jpeg" = "image/png",
): Promise<string> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return storagePath;
}

/**
 * Generate a signed (time-limited) URL for a private file.
 * Use for PREVIEW images — URL expires after ttlSeconds.
 */
export async function createSignedUrl(
  storagePath: string,
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<{ signedUrl: string; expiresAt: Date }> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, ttlSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  return { signedUrl: data.signedUrl, expiresAt };
}

/**
 * Generate a permanent signed URL for HD downloads.
 * Using a long TTL (7 days) — regenerated on each download request.
 */
export async function createHdDownloadUrl(
  storagePath: string,
): Promise<string> {
  const { signedUrl } = await createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days
  return signedUrl;
}

/**
 * Delete a file from storage (e.g., clean up failed uploads).
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

/**
 * Build a deterministic storage path for a request output.
 */
export function buildStoragePath(
  userId: string,
  requestId: string,
  type: "preview" | "hd",
): string {
  return `${userId}/${requestId}/${type}.png`;
}

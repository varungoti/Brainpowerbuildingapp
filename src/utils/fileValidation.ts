/**
 * Shared client-side guards for user-supplied files.
 *
 * These are UX guards only — they reduce the likelihood of the app choking on
 * huge uploads and give the user a clear reason when we reject something.
 * They are NOT a substitute for server-side validation on anything ever
 * persisted remotely.
 */

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MiB
export const MAX_BACKUP_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MiB — covers hefty portfolios
export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
export const ALLOWED_BACKUP_MIME = new Set([
  "application/json",
  "text/json",
  "text/plain",
  "", // some browsers report empty MIME for .json
]);

export interface FileGuardResult {
  ok: boolean;
  reason?: string;
}

function formatMiB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageFile(file: File): FileGuardResult {
  if (file.size <= 0) return { ok: false, reason: "The selected file is empty." };
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return {
      ok: false,
      reason: `Image is too large (${formatMiB(file.size)}). Max allowed is ${formatMiB(MAX_IMAGE_UPLOAD_BYTES)}.`,
    };
  }
  const mime = (file.type ?? "").toLowerCase();
  if (mime && !ALLOWED_IMAGE_MIME.has(mime)) {
    return {
      ok: false,
      reason: "Only JPEG, PNG, WebP, or GIF images are supported.",
    };
  }
  return { ok: true };
}

export function validateBackupFile(file: File): FileGuardResult {
  if (file.size <= 0) return { ok: false, reason: "The selected file is empty." };
  if (file.size > MAX_BACKUP_UPLOAD_BYTES) {
    return {
      ok: false,
      reason: `Backup file is too large (${formatMiB(file.size)}). Max allowed is ${formatMiB(MAX_BACKUP_UPLOAD_BYTES)}.`,
    };
  }
  const mime = (file.type ?? "").toLowerCase();
  const name = (file.name ?? "").toLowerCase();
  const looksLikeJson = name.endsWith(".json") || name.endsWith(".neurospark.json");
  if (!looksLikeJson && mime && !ALLOWED_BACKUP_MIME.has(mime)) {
    return { ok: false, reason: "Please choose a NeuroSpark backup (.json) file." };
  }
  return { ok: true };
}

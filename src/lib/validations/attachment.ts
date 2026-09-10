// Mirrors the DB check constraint on attachments.size_bytes (25MB) --
// enforced here too so a rejected upload never reaches Storage at all.
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

export type AttachmentOwnerColumn = "property_id" | "asset_id" | "record_id" | "warranty_id" | "space_id";

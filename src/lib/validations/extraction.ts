// Narrower than attachments: OCR only works on raster photos, and only
// JPEG/PNG are reliably decoded by the underlying image library.
export const MAX_EXTRACTION_IMAGE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_EXTRACTION_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

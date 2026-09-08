"use server";

import { requireUser } from "@/lib/dal";
import { getExtractionProvider } from "@/lib/extraction";
import type { ApplianceLabelExtraction, ReceiptExtraction } from "@/lib/extraction";
import { ALLOWED_EXTRACTION_IMAGE_TYPES, MAX_EXTRACTION_IMAGE_BYTES } from "@/lib/validations/extraction";

export type ExtractionResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function readImage(formData: FormData): Promise<{ ok: true; buffer: Buffer } | { ok: false; message: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a photo to scan." };
  }
  if (file.size > MAX_EXTRACTION_IMAGE_BYTES) {
    return { ok: false, message: "Photo is too large (10MB max)." };
  }
  if (!ALLOWED_EXTRACTION_IMAGE_TYPES.has(file.type)) {
    return { ok: false, message: "Unsupported photo type. Use JPEG or PNG." };
  }
  return { ok: true, buffer: Buffer.from(await file.arrayBuffer()) };
}

export async function extractReceiptAction(formData: FormData): Promise<ExtractionResult<ReceiptExtraction>> {
  await requireUser();
  const image = await readImage(formData);
  if (!image.ok) return image;

  try {
    const data = await getExtractionProvider().extractReceipt(image.buffer);
    return { ok: true, data };
  } catch {
    return { ok: false, message: "Couldn't read that photo -- you can still enter details manually." };
  }
}

export async function extractApplianceLabelAction(
  formData: FormData,
): Promise<ExtractionResult<ApplianceLabelExtraction>> {
  await requireUser();
  const image = await readImage(formData);
  if (!image.ok) return image;

  try {
    const data = await getExtractionProvider().extractApplianceLabel(image.buffer);
    return { ok: true, data };
  } catch {
    return { ok: false, message: "Couldn't read that photo -- you can still enter details manually." };
  }
}

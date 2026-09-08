"use server";

import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getExtractionProvider } from "@/lib/extraction";
import type { ApplianceLabelExtraction, ReceiptExtraction } from "@/lib/extraction";
import { ALLOWED_EXTRACTION_IMAGE_TYPES, MAX_EXTRACTION_IMAGE_BYTES } from "@/lib/validations/extraction";

export type ExtractionResult<T> = { ok: true; data: T } | { ok: false; message: string };

type ImageFile = { buffer: Buffer; name: string; type: string; size: number };

async function readImage(formData: FormData): Promise<{ ok: true; file: ImageFile } | { ok: false; message: string }> {
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
  return {
    ok: true,
    file: { buffer: Buffer.from(await file.arrayBuffer()), name: file.name, type: file.type, size: file.size },
  };
}

// Keeps the source photo on file (as a property-level attachment) and a
// record of every scan attempt (extraction_jobs), independent of whether the
// user goes on to save the surrounding asset/expense form -- so a scanned
// receipt or label is never silently lost, matching "your property
// remembers everything." Simplification: scans always attach at the
// property level, even one made while creating a new asset (which doesn't
// have an id yet to attach to).
async function runExtraction<T extends { confidence: number }>(
  kind: "receipt" | "appliance_label",
  extract: (buffer: Buffer) => Promise<T>,
  organizationId: string,
  propertyId: string,
  formData: FormData,
): Promise<ExtractionResult<T>> {
  const claims = await requireUser();
  const image = await readImage(formData);
  if (!image.ok) return image;

  const supabase = await createClient();
  const provider = getExtractionProvider();

  let attachmentId: string | null = null;
  const path = `${organizationId}/${crypto.randomUUID()}-${image.file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, image.file.buffer, { contentType: image.file.type });
  if (!uploadError) {
    const { data: attachment } = await supabase
      .from("attachments")
      .insert({
        organization_id: organizationId,
        property_id: propertyId,
        storage_path: path,
        file_name: image.file.name,
        mime_type: image.file.type,
        size_bytes: image.file.size,
        uploaded_by: claims.sub as string,
      })
      .select("id")
      .single();
    attachmentId = attachment?.id ?? null;
  }

  try {
    const data = await extract(image.file.buffer);
    await supabase.from("extraction_jobs").insert({
      organization_id: organizationId,
      kind,
      status: "completed",
      provider: provider.name,
      input_attachment_id: attachmentId,
      raw_result: data,
      confidence: data.confidence / 100,
      created_by: claims.sub as string,
      completed_at: new Date().toISOString(),
    });
    return { ok: true, data };
  } catch (err) {
    await supabase.from("extraction_jobs").insert({
      organization_id: organizationId,
      kind,
      status: "failed",
      provider: provider.name,
      input_attachment_id: attachmentId,
      // tesseract.js's worker communicates failures as plain strings, not
      // Error instances, so both shapes need handling here.
      error_message: err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error",
      created_by: claims.sub as string,
    });
    return { ok: false, message: "Couldn't read that photo -- you can still enter details manually." };
  }
}

export async function extractReceiptAction(
  organizationId: string,
  propertyId: string,
  formData: FormData,
): Promise<ExtractionResult<ReceiptExtraction>> {
  return runExtraction("receipt", (buffer) => getExtractionProvider().extractReceipt(buffer), organizationId, propertyId, formData);
}

export async function extractApplianceLabelAction(
  organizationId: string,
  propertyId: string,
  formData: FormData,
): Promise<ExtractionResult<ApplianceLabelExtraction>> {
  return runExtraction(
    "appliance_label",
    (buffer) => getExtractionProvider().extractApplianceLabel(buffer),
    organizationId,
    propertyId,
    formData,
  );
}

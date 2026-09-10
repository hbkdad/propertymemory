"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
  type AttachmentOwnerColumn,
} from "@/lib/validations/attachment";

export type AttachmentFormState = { message?: string } | undefined;

export async function uploadAttachment(
  organizationId: string,
  ownerColumn: AttachmentOwnerColumn,
  ownerId: string,
  redirectPath: string,
  _state: AttachmentFormState,
  formData: FormData,
): Promise<AttachmentFormState> {
  const claims = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose a file to upload." };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { message: "File is too large (25MB max)." };
  }
  // Never trust a client-supplied content-type alone in general -- here it's
  // at least consistent, since we also pass it as the Storage object's
  // contentType and it's re-validated against the same allow-list.
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    return { message: "Unsupported file type. Use JPEG, PNG, WEBP, HEIC, or PDF." };
  }

  const supabase = await createClient();
  // Namespaced by organization_id, matching the storage.objects RLS policy
  // in the schema migration -- never a client-supplied path.
  const path = `${organizationId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) {
    return { message: uploadError.message };
  }

  const owners: Record<AttachmentOwnerColumn, string | null> = {
    property_id: null,
    asset_id: null,
    record_id: null,
    warranty_id: null,
    space_id: null,
  };
  owners[ownerColumn] = ownerId;

  const { error: insertError } = await supabase.from("attachments").insert({
    organization_id: organizationId,
    ...owners,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: claims.sub as string,
  });

  if (insertError) {
    // Roll back the storage object so a failed insert doesn't leave an
    // orphaned file with no owning row.
    await supabase.storage.from("attachments").remove([path]);
    return { message: insertError.message };
  }

  revalidatePath(redirectPath);
  return undefined;
}

export async function deleteAttachment(attachmentId: string, storagePath: string, redirectPath: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.storage.from("attachments").remove([storagePath]);
  await supabase.from("attachments").delete().eq("id", attachmentId);
  revalidatePath(redirectPath);
}

// A separate action from uploadAttachment rather than more optional
// parameters on it: a room photo always has the same owner column (space_id)
// and role ("photo"), and needs is_cover/width_px/height_px that a document
// upload never does -- different enough shape to earn its own function
// (same reasoning ADR 0005 used to keep warranties/expenses out of records).
export async function uploadRoomPhoto(
  organizationId: string,
  spaceId: string,
  redirectPath: string,
  _state: AttachmentFormState,
  formData: FormData,
): Promise<AttachmentFormState> {
  const claims = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose a photo to upload." };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { message: "File is too large (25MB max)." };
  }
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type) || file.type === "application/pdf") {
    return { message: "Unsupported file type. Use JPEG, PNG, WEBP, or HEIC." };
  }

  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));

  const supabase = await createClient();
  const path = `${organizationId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) {
    return { message: uploadError.message };
  }

  // The first photo added to a space becomes its cover automatically;
  // later ones don't, so adding a second photo never silently swaps the
  // room's thumbnail out from under the user.
  const { count: existingPhotos } = await supabase
    .from("attachments")
    .select("id", { count: "exact", head: true })
    .eq("space_id", spaceId)
    .eq("role", "photo");

  const { error: insertError } = await supabase.from("attachments").insert({
    organization_id: organizationId,
    space_id: spaceId,
    role: "photo",
    is_cover: (existingPhotos ?? 0) === 0,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    width_px: Number.isFinite(width) && width > 0 ? width : null,
    height_px: Number.isFinite(height) && height > 0 ? height : null,
    uploaded_by: claims.sub as string,
  });

  if (insertError) {
    await supabase.storage.from("attachments").remove([path]);
    return { message: insertError.message };
  }

  revalidatePath(redirectPath);
  return undefined;
}

// Not transactional (two sequential statements) -- acceptable here since
// this is a UX-only toggle triggered by one user's own click, not a security
// boundary; the attachments_one_cover_per_space unique index still prevents
// actual data corruption even in the unlikely case of two rapid clicks.
export async function setCoverPhoto(spaceId: string, attachmentId: string, redirectPath: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("attachments").update({ is_cover: false }).eq("space_id", spaceId).eq("is_cover", true);
  await supabase.from("attachments").update({ is_cover: true }).eq("id", attachmentId);
  revalidatePath(redirectPath);
}

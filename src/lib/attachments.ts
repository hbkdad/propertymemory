import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AttachmentOwnerColumn } from "@/lib/validations/attachment";
import type { Tables } from "@/lib/supabase/database.types";

export type AttachmentWithUrl = Tables<"attachments"> & { url: string | null };

// Signed URLs are generated in one batched call across every matching
// attachment, then grouped by owner id -- avoids an N+1 Storage call per
// record/warranty when a property has many of either.
export async function getAttachmentsByOwner(
  ownerColumn: AttachmentOwnerColumn,
  ownerIds: string[],
  role: "document" | "photo" = "document",
): Promise<Map<string, AttachmentWithUrl[]>> {
  const map = new Map<string, AttachmentWithUrl[]>();
  if (ownerIds.length === 0) return map;

  const supabase = await createClient();
  const { data: attachments } = await supabase
    .from("attachments")
    .select("*")
    .in(ownerColumn, ownerIds)
    .eq("role", role)
    .order("created_at");

  const paths = (attachments ?? []).map((attachment) => attachment.storage_path);
  const { data: signedUrls } =
    paths.length > 0
      ? await supabase.storage.from("attachments").createSignedUrls(paths, 300)
      : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signedUrls ?? []).map((entry) => [entry.path, entry.signedUrl]));

  for (const attachment of attachments ?? []) {
    const ownerId = attachment[ownerColumn];
    if (!ownerId) continue;
    const withUrl: AttachmentWithUrl = { ...attachment, url: urlByPath.get(attachment.storage_path) ?? null };
    const list = map.get(ownerId);
    if (list) {
      list.push(withUrl);
    } else {
      map.set(ownerId, [withUrl]);
    }
  }
  return map;
}

// Single-owner convenience wrapper for the property/asset detail pages.
export async function getAttachmentsForOwner(
  ownerColumn: AttachmentOwnerColumn,
  ownerId: string,
  role: "document" | "photo" = "document",
): Promise<AttachmentWithUrl[]> {
  const map = await getAttachmentsByOwner(ownerColumn, [ownerId], role);
  return map.get(ownerId) ?? [];
}

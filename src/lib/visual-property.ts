import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getAttachmentsByOwner } from "@/lib/attachments";
import type { Tables } from "@/lib/supabase/database.types";

export type PropertyHero = {
  property: Tables<"properties">;
  coverPhotoUrl: string | null;
  stats: { units: number; rooms: number; assets: number; records: number };
};

// Property-level cover photo: an attachment with property_id set, role
// 'photo', is_cover true -- same shape as a room's cover photo, just owned
// one level up (see ADR 0006 / the migration comment on attachments.role).
export async function getPropertyHero(propertyId: string): Promise<PropertyHero | null> {
  const supabase = await createClient();
  const [{ data: property }, counts, coverPhoto] = await Promise.all([
    supabase.from("properties").select("*").eq("id", propertyId).maybeSingle(),
    Promise.all([
      supabase.from("units").select("id", { count: "exact", head: true }).eq("property_id", propertyId),
      supabase.from("spaces").select("id", { count: "exact", head: true }).eq("property_id", propertyId),
      supabase.from("assets").select("id", { count: "exact", head: true }).eq("property_id", propertyId),
      supabase.from("records").select("id", { count: "exact", head: true }).eq("property_id", propertyId),
    ]),
    getAttachmentsByOwner("property_id", [propertyId], "photo"),
  ]);

  if (!property) return null;

  const [units, rooms, assets, records] = counts;
  const cover = (coverPhoto.get(propertyId) ?? []).find((photo) => photo.is_cover) ?? null;

  return {
    property,
    coverPhotoUrl: cover?.url ?? null,
    stats: {
      units: units.count ?? 0,
      rooms: rooms.count ?? 0,
      assets: assets.count ?? 0,
      records: records.count ?? 0,
    },
  };
}

export type RoomPickerEntry = {
  space: Tables<"spaces">;
  coverPhotoUrl: string | null;
  hotspotCount: number;
};

export async function getRoomPicker(propertyId: string): Promise<RoomPickerEntry[]> {
  const supabase = await createClient();
  const { data: spaces } = await supabase
    .from("spaces")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at");
  const spaceList = spaces ?? [];
  if (spaceList.length === 0) return [];

  const spaceIds = spaceList.map((space) => space.id);
  const photosBySpace = await getAttachmentsByOwner("space_id", spaceIds, "photo");

  const spaceIdByPhotoId = new Map<string, string>();
  for (const [spaceId, photos] of photosBySpace) {
    for (const photo of photos) spaceIdByPhotoId.set(photo.id, spaceId);
  }
  const allPhotoIds = [...spaceIdByPhotoId.keys()];
  const { data: annotationCounts } =
    allPhotoIds.length > 0
      ? await supabase.from("visual_annotations").select("attachment_id").in("attachment_id", allPhotoIds)
      : { data: [] as { attachment_id: string }[] };

  const hotspotCountBySpace = new Map<string, number>();
  for (const row of annotationCounts ?? []) {
    const spaceId = spaceIdByPhotoId.get(row.attachment_id);
    if (!spaceId) continue;
    hotspotCountBySpace.set(spaceId, (hotspotCountBySpace.get(spaceId) ?? 0) + 1);
  }

  return spaceList.map((space) => {
    const photos = photosBySpace.get(space.id) ?? [];
    const cover = photos.find((photo) => photo.is_cover) ?? photos[0] ?? null;
    return {
      space,
      coverPhotoUrl: cover?.url ?? null,
      hotspotCount: hotspotCountBySpace.get(space.id) ?? 0,
    };
  });
}

export type StageAssetField = { label: string; value: string };
export type StageAsset = {
  id: string;
  name: string;
  category: string | null;
  fields: StageAssetField[];
  history: { id: string; date: string; type: string; note: string | null }[];
  attachments: { id: string; name: string; url: string | null }[];
};

export type StageAnnotation = {
  id: string;
  annotationType: string;
  coordinates: Record<string, number | number[][]>;
  label: string;
  asset: StageAsset | null;
};

export type StagePhoto = {
  id: string;
  url: string;
  storagePath: string;
  width: number | null;
  height: number | null;
  isCover: boolean;
  annotations: StageAnnotation[];
};

export type RoomStage = {
  space: Tables<"spaces">;
  photos: StagePhoto[];
};

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatCurrency(value: number | null): string | null {
  if (value === null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export async function getRoomStage(propertyId: string, spaceId: string): Promise<RoomStage | null> {
  const supabase = await createClient();
  const { data: space } = await supabase
    .from("spaces")
    .select("*")
    .eq("id", spaceId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (!space) return null;

  const photosMap = await getAttachmentsByOwner("space_id", [spaceId], "photo");
  const photos = photosMap.get(spaceId) ?? [];
  if (photos.length === 0) {
    return { space, photos: [] };
  }

  const photoIds = photos.map((photo) => photo.id);
  const { data: annotations } = await supabase
    .from("visual_annotations")
    .select("*")
    .in("attachment_id", photoIds)
    .order("created_at");
  const annotationList = annotations ?? [];

  const assetIds = [...new Set(annotationList.map((a) => a.asset_id).filter((id): id is string => !!id))];

  const [{ data: assets }, { data: recordRows }, attachmentsByAssetId] = await Promise.all([
    assetIds.length > 0
      ? supabase.from("assets").select("*, asset_categories(label), vendors(name)").in("id", assetIds)
      : Promise.resolve({ data: [] as never[] }),
    assetIds.length > 0
      ? supabase
          .from("records")
          .select("*, record_types(label)")
          .in("asset_id", assetIds)
          .order("occurred_on", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    getAttachmentsByOwner("asset_id", assetIds, "document"),
  ]);

  const assetById = new Map<string, StageAsset>();
  for (const asset of (assets ?? []) as Array<
    Tables<"assets"> & { asset_categories: { label: string } | null; vendors: { name: string } | null }
  >) {
    const fields: StageAssetField[] = [];
    if (asset.manufacturer) fields.push({ label: "Manufacturer", value: asset.manufacturer });
    if (asset.model_number) fields.push({ label: "Model", value: asset.model_number });
    if (asset.serial_number) fields.push({ label: "Serial", value: asset.serial_number });
    if (asset.installed_on) fields.push({ label: "Installed", value: formatDate(asset.installed_on) });
    if (asset.purchased_on) fields.push({ label: "Purchased", value: formatDate(asset.purchased_on) });
    if (asset.vendors?.name) fields.push({ label: "Purchased from", value: asset.vendors.name });
    const cost = formatCurrency(asset.purchase_price);
    if (cost) fields.push({ label: "Cost", value: cost });
    if (asset.location_note) fields.push({ label: "Location", value: asset.location_note });
    if (asset.notes) fields.push({ label: "Notes", value: asset.notes });

    assetById.set(asset.id, {
      id: asset.id,
      name: asset.name,
      category: asset.asset_categories?.label ?? null,
      fields,
      history: [],
      attachments: (attachmentsByAssetId.get(asset.id) ?? []).map((attachment) => ({
        id: attachment.id,
        name: attachment.file_name,
        url: attachment.url,
      })),
    });
  }

  for (const record of (recordRows ?? []) as Array<
    Tables<"records"> & { record_types: { label: string } | null }
  >) {
    const asset = record.asset_id ? assetById.get(record.asset_id) : undefined;
    if (!asset) continue;
    asset.history.push({
      id: record.id,
      date: formatDate(record.occurred_on),
      type: record.record_types?.label ?? "Record",
      note: record.description ?? record.title,
    });
  }

  const annotationsByPhotoId = new Map<string, StageAnnotation[]>();
  for (const annotation of annotationList) {
    const list = annotationsByPhotoId.get(annotation.attachment_id) ?? [];
    list.push({
      id: annotation.id,
      annotationType: annotation.annotation_type,
      coordinates: annotation.coordinates as Record<string, number | number[][]>,
      label: annotation.label,
      asset: annotation.asset_id ? (assetById.get(annotation.asset_id) ?? null) : null,
    });
    annotationsByPhotoId.set(annotation.attachment_id, list);
  }

  const stagePhotos: StagePhoto[] = photos
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover))
    .map((photo) => ({
      id: photo.id,
      url: photo.url ?? "",
      storagePath: photo.storage_path,
      width: photo.width_px,
      height: photo.height_px,
      isCover: photo.is_cover,
      annotations: annotationsByPhotoId.get(photo.id) ?? [],
    }));

  return { space, photos: stagePhotos };
}

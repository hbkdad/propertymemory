"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { annotationSchema } from "@/lib/validations/visual-annotation";
import type { Json } from "@/lib/supabase/database.types";

export type AnnotationFormState = { errors?: Record<string, string[]>; message?: string } | undefined;

export async function createAnnotation(
  organizationId: string,
  attachmentId: string,
  redirectPath: string,
  _state: AnnotationFormState,
  formData: FormData,
): Promise<AnnotationFormState> {
  const claims = await requireUser();

  const coordinatesRaw = formData.get("coordinates");
  let coordinates: unknown;
  try {
    coordinates = JSON.parse(typeof coordinatesRaw === "string" ? coordinatesRaw : "");
  } catch {
    return { message: "Invalid hotspot shape." };
  }

  const validated = annotationSchema.safeParse({
    annotationType: formData.get("annotationType"),
    coordinates,
    label: formData.get("label"),
    assetId: formData.get("assetId") || undefined,
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("visual_annotations").insert({
    organization_id: organizationId,
    attachment_id: attachmentId,
    annotation_type: validated.data.annotationType,
    coordinates: validated.data.coordinates as Json,
    label: validated.data.label,
    asset_id: validated.data.assetId ?? null,
    created_by: claims.sub as string,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath(redirectPath);
  return undefined;
}

export async function linkAnnotationAsset(annotationId: string, assetId: string, redirectPath: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("visual_annotations").update({ asset_id: assetId }).eq("id", annotationId);
  revalidatePath(redirectPath);
}

export async function deleteAnnotation(annotationId: string, redirectPath: string) {
  await requireUser();
  const supabase = await createClient();
  // Deletes the pin only -- never touches the asset it points to (see ADR 0006).
  await supabase.from("visual_annotations").delete().eq("id", annotationId);
  revalidatePath(redirectPath);
}

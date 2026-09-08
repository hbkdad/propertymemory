"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { assetSchema } from "@/lib/validations/asset";

export type AssetFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string }
  | undefined;

function parseAssetForm(formData: FormData) {
  return assetSchema.safeParse({
    name: formData.get("name"),
    assetCategoryId: formData.get("assetCategoryId") || undefined,
    spaceId: formData.get("spaceId") || undefined,
    manufacturer: formData.get("manufacturer") || undefined,
    modelNumber: formData.get("modelNumber") || undefined,
    serialNumber: formData.get("serialNumber") || undefined,
    installedOn: formData.get("installedOn") || undefined,
    purchasedOn: formData.get("purchasedOn") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createAsset(
  propertyId: string,
  organizationId: string,
  _state: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  const claims = await requireUser();

  const validated = parseAssetForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assets").insert({
    organization_id: organizationId,
    property_id: propertyId,
    space_id: validated.data.spaceId || null,
    asset_category_id: validated.data.assetCategoryId || null,
    name: validated.data.name,
    manufacturer: validated.data.manufacturer,
    model_number: validated.data.modelNumber,
    serial_number: validated.data.serialNumber,
    installed_on: validated.data.installedOn || null,
    purchased_on: validated.data.purchasedOn || null,
    notes: validated.data.notes,
    created_by: claims.sub as string,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}

export async function updateAsset(
  assetId: string,
  propertyId: string,
  _state: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  await requireUser();

  const validated = parseAssetForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assets")
    .update({
      space_id: validated.data.spaceId || null,
      asset_category_id: validated.data.assetCategoryId || null,
      name: validated.data.name,
      manufacturer: validated.data.manufacturer,
      model_number: validated.data.modelNumber,
      serial_number: validated.data.serialNumber,
      installed_on: validated.data.installedOn || null,
      purchased_on: validated.data.purchasedOn || null,
      notes: validated.data.notes,
    })
    .eq("id", assetId);

  if (error) {
    return { message: error.message };
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function deleteAsset(assetId: string, propertyId: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("assets").delete().eq("id", assetId);
  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}

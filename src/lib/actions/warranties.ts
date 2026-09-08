"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { warrantySchema } from "@/lib/validations/warranty";

export type WarrantyFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string }
  | undefined;

export async function createWarranty(
  propertyId: string,
  organizationId: string,
  assetId: string | null,
  redirectPath: string,
  _state: WarrantyFormState,
  formData: FormData,
): Promise<WarrantyFormState> {
  const claims = await requireUser();

  const validated = warrantySchema.safeParse({
    provider: formData.get("provider"),
    policyNumber: formData.get("policyNumber") || undefined,
    claimReference: formData.get("claimReference") || undefined,
    startsOn: formData.get("startsOn") || undefined,
    expiresOn: formData.get("expiresOn"),
    notes: formData.get("notes") || undefined,
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("warranties").insert({
    organization_id: organizationId,
    property_id: propertyId,
    asset_id: assetId,
    provider: validated.data.provider,
    policy_number: validated.data.policyNumber,
    claim_reference: validated.data.claimReference,
    starts_on: validated.data.startsOn || null,
    expires_on: validated.data.expiresOn,
    notes: validated.data.notes,
    created_by: claims.sub as string,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath(redirectPath);
  return undefined;
}

export async function deleteWarranty(warrantyId: string, redirectPath: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("warranties").delete().eq("id", warrantyId);
  revalidatePath(redirectPath);
}

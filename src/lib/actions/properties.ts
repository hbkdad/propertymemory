"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentMembership, requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { propertySchema } from "@/lib/validations/property";

export type PropertyFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string }
  | undefined;

function parsePropertyForm(formData: FormData) {
  return propertySchema.safeParse({
    name: formData.get("name"),
    propertyType: formData.get("propertyType"),
    addressLine1: formData.get("addressLine1") || undefined,
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city") || undefined,
    region: formData.get("region") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

export async function createProperty(
  _state: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const claims = await requireUser();
  const membership = await getCurrentMembership();
  if (!membership?.organizations) {
    redirect("/onboarding");
  }

  const validated = parsePropertyForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("properties").insert({
    organization_id: membership.organizations.id,
    name: validated.data.name,
    property_type: validated.data.propertyType,
    address_line1: validated.data.addressLine1,
    address_line2: validated.data.addressLine2,
    city: validated.data.city,
    region: validated.data.region,
    postal_code: validated.data.postalCode,
    notes: validated.data.notes,
    created_by: claims.sub as string,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProperty(
  propertyId: string,
  _state: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  await requireUser();

  const validated = parsePropertyForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  // RLS scopes this update to the caller's own organization already; no
  // need to filter by organization_id here too (see ADR 0002 -- RLS is the
  // real boundary, this call doesn't need to duplicate it to be safe, only
  // to be correct, and .eq("id", ...) is sufficient for that).
  const { error } = await supabase
    .from("properties")
    .update({
      name: validated.data.name,
      property_type: validated.data.propertyType,
      address_line1: validated.data.addressLine1,
      address_line2: validated.data.addressLine2,
      city: validated.data.city,
      region: validated.data.region,
      postal_code: validated.data.postalCode,
      notes: validated.data.notes,
    })
    .eq("id", propertyId);

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}

export async function deleteProperty(propertyId: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("properties").delete().eq("id", propertyId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { spaceSchema } from "@/lib/validations/space";

export type SpaceFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string }
  | undefined;

export async function createSpace(
  propertyId: string,
  organizationId: string,
  _state: SpaceFormState,
  formData: FormData,
): Promise<SpaceFormState> {
  await requireUser();

  const validated = spaceSchema.safeParse({
    name: formData.get("name"),
    spaceType: formData.get("spaceType") || undefined,
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("spaces").insert({
    organization_id: organizationId,
    property_id: propertyId,
    name: validated.data.name,
    space_type: validated.data.spaceType,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath(`/properties/${propertyId}`);
  return undefined;
}

export async function deleteSpace(spaceId: string, propertyId: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("spaces").delete().eq("id", spaceId);
  revalidatePath(`/properties/${propertyId}`);
}

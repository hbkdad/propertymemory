"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { parseScope, recordSchema } from "@/lib/validations/record";

export type RecordFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string }
  | undefined;

function parseRecordForm(formData: FormData) {
  return recordSchema.safeParse({
    recordTypeId: formData.get("recordTypeId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    occurredOn: formData.get("occurredOn"),
    cost: formData.get("cost") || undefined,
    scope: formData.get("scope") || undefined,
  });
}

export async function createRecord(
  propertyId: string,
  organizationId: string,
  redirectTo: string,
  _state: RecordFormState,
  formData: FormData,
): Promise<RecordFormState> {
  const claims = await requireUser();

  const validated = parseRecordForm(formData);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { spaceId, assetId } = parseScope(validated.data.scope);
  const cost = validated.data.cost ? Number(validated.data.cost) : null;
  if (cost !== null && Number.isNaN(cost)) {
    return { errors: { cost: ["Must be a number"] } };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("records").insert({
    organization_id: organizationId,
    property_id: propertyId,
    space_id: spaceId,
    asset_id: assetId,
    record_type_id: validated.data.recordTypeId,
    title: validated.data.title,
    description: validated.data.description,
    occurred_on: validated.data.occurredOn,
    cost,
    created_by: claims.sub as string,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath(redirectTo);
  return undefined;
}

export async function deleteRecord(recordId: string, redirectPath: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("records").delete().eq("id", recordId);
  revalidatePath(redirectPath);
}

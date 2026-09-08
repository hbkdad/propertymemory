"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations/onboarding";

export type OnboardingFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string }
  | undefined;

export async function completeOnboarding(
  _state: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const claims = await requireUser();

  const validated = onboardingSchema.safeParse({
    accountName: formData.get("accountName"),
    propertyName: formData.get("propertyName"),
    propertyType: formData.get("propertyType"),
    addressLine1: formData.get("addressLine1") || undefined,
    city: formData.get("city") || undefined,
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  // create_organization returns a single row (not a set) -- do not chain
  // .single(), the client already gives back the object directly. Calling
  // it via .rpc() (rather than raw SQL dot-notation) invokes it exactly
  // once; see the function's comment in the schema migration for why that
  // distinction matters.
  const { data: org, error: orgError } = await supabase.rpc("create_organization", {
    p_name: validated.data.accountName,
  });

  if (orgError || !org) {
    return { message: orgError?.message ?? "Could not create your account. Please try again." };
  }

  const { error: propertyError } = await supabase.from("properties").insert({
    organization_id: org.id,
    name: validated.data.propertyName,
    property_type: validated.data.propertyType,
    address_line1: validated.data.addressLine1,
    city: validated.data.city,
    created_by: claims.sub as string,
  });

  if (propertyError) {
    return { message: propertyError.message };
  }

  redirect("/dashboard");
}

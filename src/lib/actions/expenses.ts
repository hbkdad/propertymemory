"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { expenseSchema } from "@/lib/validations/expense";

export type ExpenseFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string }
  | undefined;

function parseAmount(value: string | undefined) {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

export async function createExpense(
  propertyId: string,
  organizationId: string,
  redirectPath: string,
  _state: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const claims = await requireUser();

  const validated = expenseSchema.safeParse({
    amount: formData.get("amount"),
    taxAmount: formData.get("taxAmount") || undefined,
    category: formData.get("category"),
    expenseDate: formData.get("expenseDate"),
    notes: formData.get("notes") || undefined,
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const amount = parseAmount(validated.data.amount);
  const taxAmount = parseAmount(validated.data.taxAmount);
  if (amount === null || Number.isNaN(amount)) {
    return { errors: { amount: ["Must be a number"] } };
  }
  if (Number.isNaN(taxAmount)) {
    return { errors: { taxAmount: ["Must be a number"] } };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    organization_id: organizationId,
    property_id: propertyId,
    amount,
    tax_amount: taxAmount ?? 0,
    category: validated.data.category,
    expense_date: validated.data.expenseDate,
    notes: validated.data.notes,
    created_by: claims.sub as string,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath(redirectPath);
  return undefined;
}

export async function deleteExpense(expenseId: string, redirectPath: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", expenseId);
  revalidatePath(redirectPath);
}

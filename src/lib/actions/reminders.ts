"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { advanceDueDate, reminderSchema } from "@/lib/validations/reminder";

export type ReminderFormState =
  | { errors?: Record<string, string[] | undefined>; message?: string }
  | undefined;

export async function createReminder(
  propertyId: string,
  organizationId: string,
  redirectPath: string,
  _state: ReminderFormState,
  formData: FormData,
): Promise<ReminderFormState> {
  const claims = await requireUser();

  const validated = reminderSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueOn: formData.get("dueOn"),
    isRecurring: formData.get("isRecurring") === "on",
    recurrenceInterval: formData.get("recurrenceInterval") || undefined,
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reminders").insert({
    organization_id: organizationId,
    property_id: propertyId,
    title: validated.data.title,
    description: validated.data.description,
    due_on: validated.data.dueOn,
    is_recurring: validated.data.isRecurring,
    recurrence_interval: validated.data.isRecurring ? validated.data.recurrenceInterval : null,
    created_by: claims.sub as string,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath(redirectPath);
  return undefined;
}

// One-time reminders are marked inactive (done, hidden); recurring ones roll
// their due date forward by the interval and stay active.
export async function completeReminder(redirectPath: string, formData: FormData) {
  await requireUser();
  const reminderId = formData.get("reminderId") as string;
  const isRecurring = formData.get("isRecurring") === "true";
  const dueOn = formData.get("dueOn") as string;
  const interval = formData.get("recurrenceInterval") as
    | Parameters<typeof advanceDueDate>[1]
    | null;

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  if (isRecurring && interval) {
    await supabase
      .from("reminders")
      .update({ last_completed_on: today, due_on: advanceDueDate(dueOn, interval) })
      .eq("id", reminderId);
  } else {
    await supabase
      .from("reminders")
      .update({ last_completed_on: today, is_active: false })
      .eq("id", reminderId);
  }

  revalidatePath(redirectPath);
}

export async function deleteReminder(reminderId: string, redirectPath: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("reminders").delete().eq("id", reminderId);
  revalidatePath(redirectPath);
}

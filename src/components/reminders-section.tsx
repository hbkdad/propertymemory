"use client";

import { useActionState, useState } from "react";
import { completeReminder, createReminder, deleteReminder } from "@/lib/actions/reminders";
import { recurrenceIntervalLabels, recurrenceIntervals } from "@/lib/validations/reminder";
import type { Tables } from "@/lib/supabase/database.types";

function isOverdue(dueOn: string) {
  return new Date(`${dueOn}T00:00:00Z`).getTime() < Date.now();
}

export function RemindersSection({
  propertyId,
  organizationId,
  reminders,
}: {
  propertyId: string;
  organizationId: string;
  reminders: Tables<"reminders">[];
}) {
  const redirectPath = `/properties/${propertyId}`;
  const createWithIds = createReminder.bind(null, propertyId, organizationId, redirectPath);
  const [state, action, pending] = useActionState(createWithIds, undefined);
  const [recurring, setRecurring] = useState(false);
  const completeWithPath = completeReminder.bind(null, redirectPath);

  const active = reminders.filter((r) => r.is_active);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Reminders</h2>
      <ul className="mt-3 space-y-2">
        {active.map((reminder) => {
          const overdue = isOverdue(reminder.due_on);
          return (
            <li key={reminder.id} className="flex items-start justify-between text-sm">
              <div>
                <p className="font-medium">{reminder.title}</p>
                <p className={`text-xs ${overdue ? "text-red-600" : "text-zinc-500"}`}>
                  Due {reminder.due_on}
                  {overdue ? " -- overdue" : ""}
                  {reminder.is_recurring && reminder.recurrence_interval
                    ? ` -- ${recurrenceIntervalLabels[reminder.recurrence_interval as (typeof recurrenceIntervals)[number]]}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <form action={completeWithPath}>
                  <input type="hidden" name="reminderId" value={reminder.id} />
                  <input type="hidden" name="isRecurring" value={String(reminder.is_recurring)} />
                  <input type="hidden" name="dueOn" value={reminder.due_on} />
                  <input
                    type="hidden"
                    name="recurrenceInterval"
                    value={reminder.recurrence_interval ?? ""}
                  />
                  <button type="submit" className="text-xs underline">
                    Done
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => deleteReminder(reminder.id, redirectPath)}
                  className="text-xs text-red-600 underline"
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
        {active.length === 0 && <li className="text-sm text-zinc-500">No reminders yet.</li>}
      </ul>

      <form
        action={action}
        className="mt-4 space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
      >
        <div className="space-y-1">
          <label htmlFor="reminderTitle" className="text-xs font-medium">
            Reminder
          </label>
          <input
            id="reminderTitle"
            name="title"
            required
            placeholder="e.g. Replace furnace filter"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {state?.errors?.title && <p className="text-xs text-red-600">{state.errors.title[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="dueOn" className="text-xs font-medium">
              Due
            </label>
            <input
              id="dueOn"
              name="dueOn"
              type="date"
              required
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {state?.errors?.dueOn && <p className="text-xs text-red-600">{state.errors.dueOn[0]}</p>}
          </div>
          <div className="flex items-end gap-2 pb-1.5">
            <input
              id="isRecurring"
              name="isRecurring"
              type="checkbox"
              checked={recurring}
              onChange={(event) => setRecurring(event.target.checked)}
            />
            <label htmlFor="isRecurring" className="text-xs font-medium">
              Repeats
            </label>
          </div>
        </div>

        {recurring && (
          <div className="space-y-1">
            <label htmlFor="recurrenceInterval" className="text-xs font-medium">
              How often
            </label>
            <select
              id="recurrenceInterval"
              name="recurrenceInterval"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {recurrenceIntervals.map((interval) => (
                <option key={interval} value={interval}>
                  {recurrenceIntervalLabels[interval]}
                </option>
              ))}
            </select>
            {state?.errors?.recurrenceInterval && (
              <p className="text-xs text-red-600">{state.errors.recurrenceInterval[0]}</p>
            )}
          </div>
        )}

        {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {pending ? "Adding..." : "Add reminder"}
        </button>
      </form>
    </section>
  );
}

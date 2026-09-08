import { z } from "zod";

export const recurrenceIntervals = ["weekly", "monthly", "quarterly", "semiannual", "annual"] as const;

export const recurrenceIntervalLabels: Record<(typeof recurrenceIntervals)[number], string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Every 6 months",
  annual: "Yearly",
};

export const reminderSchema = z
  .object({
    title: z.string().trim().min(1, "Required"),
    description: z.string().trim().optional(),
    dueOn: z.string().trim().min(1, "Required"),
    isRecurring: z.boolean(),
    recurrenceInterval: z.enum(recurrenceIntervals).optional(),
  })
  .refine((data) => !data.isRecurring || !!data.recurrenceInterval, {
    message: "Choose how often this repeats",
    path: ["recurrenceInterval"],
  });

export function advanceDueDate(dueOn: string, interval: (typeof recurrenceIntervals)[number]) {
  const date = new Date(`${dueOn}T00:00:00Z`);

  if (interval === "weekly") {
    date.setUTCDate(date.getUTCDate() + 7);
    return date.toISOString().slice(0, 10);
  }

  const monthsToAdd = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 }[interval];
  const originalDay = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + monthsToAdd, 1);
  // setUTCMonth(m, 1) lands on the 1st of the target month, so the length of
  // that specific month is now known -- clamp instead of letting an
  // overflowing day (e.g. Jan 31 + 1 month) silently roll into the month
  // after next (Feb has no 31st, so the naive version would land in March).
  const daysInTargetMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, daysInTargetMonth));
  return date.toISOString().slice(0, 10);
}

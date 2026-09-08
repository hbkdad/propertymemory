import { z } from "zod";

export const expenseCategories = ["maintenance", "repair", "renovation", "supplies", "other"] as const;

export const expenseCategoryLabels: Record<(typeof expenseCategories)[number], string> = {
  maintenance: "Maintenance",
  repair: "Repair",
  renovation: "Renovation",
  supplies: "Supplies",
  other: "Other",
};

export const expenseSchema = z.object({
  amount: z.string().trim().min(1, "Required"),
  taxAmount: z.string().trim().optional(),
  category: z.enum(expenseCategories),
  expenseDate: z.string().trim().min(1, "Required"),
  notes: z.string().trim().optional(),
});

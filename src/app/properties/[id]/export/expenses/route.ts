import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET(_request: Request, ctx: RouteContext<"/properties/[id]/export/expenses">) {
  await requireUser();
  const { id } = await ctx.params;

  const supabase = await createClient();
  const { data: property } = await supabase.from("properties").select("name").eq("id", id).maybeSingle();
  if (!property) {
    notFound();
  }

  const { data: expenses } = await supabase
    .from("expenses")
    .select("expense_date, amount, tax_amount, category, currency, notes")
    .eq("property_id", id)
    .order("expense_date", { ascending: false });

  const rows = (expenses ?? []).map((expense) => ({
    date: expense.expense_date,
    amount: expense.amount,
    tax_amount: expense.tax_amount,
    total: (expense.amount + expense.tax_amount).toFixed(2),
    category: expense.category,
    currency: expense.currency,
    notes: expense.notes ?? "",
  }));

  const csv = toCsv(rows, [
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount" },
    { key: "tax_amount", label: "Tax" },
    { key: "total", label: "Total" },
    { key: "category", label: "Category" },
    { key: "currency", label: "Currency" },
    { key: "notes", label: "Notes" },
  ]);

  return csvResponse(csv, `${property.name.replace(/[^\w -]/g, "")}-expenses.csv`);
}

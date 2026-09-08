import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET(_request: Request, ctx: RouteContext<"/properties/[id]/export/records">) {
  await requireUser();
  const { id } = await ctx.params;

  const supabase = await createClient();
  const { data: property } = await supabase.from("properties").select("name").eq("id", id).maybeSingle();
  if (!property) {
    notFound();
  }

  const { data: records } = await supabase
    .from("records")
    .select("occurred_on, title, description, cost, record_types(label), spaces(name), assets(name)")
    .eq("property_id", id)
    .order("occurred_on", { ascending: false });

  const rows = (records ?? []).map((record) => ({
    date: record.occurred_on,
    type: record.record_types?.label ?? "",
    title: record.title,
    description: record.description ?? "",
    location: record.spaces?.name ?? record.assets?.name ?? "Whole property",
    cost: record.cost ?? "",
  }));

  const csv = toCsv(rows, [
    { key: "date", label: "Date" },
    { key: "type", label: "Type" },
    { key: "title", label: "Title" },
    { key: "description", label: "Description" },
    { key: "location", label: "Location" },
    { key: "cost", label: "Cost" },
  ]);

  return csvResponse(csv, `${property.name.replace(/[^\w -]/g, "")}-history.csv`);
}

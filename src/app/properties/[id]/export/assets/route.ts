import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET(_request: Request, ctx: RouteContext<"/properties/[id]/export/assets">) {
  await requireUser();
  const { id } = await ctx.params;

  const supabase = await createClient();
  const { data: property } = await supabase.from("properties").select("name").eq("id", id).maybeSingle();
  if (!property) {
    notFound();
  }

  const { data: assets } = await supabase
    .from("assets")
    .select(
      "name, manufacturer, model_number, serial_number, location_note, installed_on, purchased_on, purchase_price, asset_categories(label), spaces(name)",
    )
    .eq("property_id", id)
    .order("name");

  const rows = (assets ?? []).map((asset) => ({
    name: asset.name,
    category: asset.asset_categories?.label ?? "",
    space: asset.spaces?.name ?? "",
    manufacturer: asset.manufacturer ?? "",
    model_number: asset.model_number ?? "",
    serial_number: asset.serial_number ?? "",
    location_note: asset.location_note ?? "",
    installed_on: asset.installed_on ?? "",
    purchased_on: asset.purchased_on ?? "",
    purchase_price: asset.purchase_price ?? "",
  }));

  const csv = toCsv(rows, [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "space", label: "Space" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "model_number", label: "Model number" },
    { key: "serial_number", label: "Serial number" },
    { key: "location_note", label: "Location" },
    { key: "installed_on", label: "Installed" },
    { key: "purchased_on", label: "Purchased" },
    { key: "purchase_price", label: "Purchase price" },
  ]);

  return csvResponse(csv, `${property.name.replace(/[^\w -]/g, "")}-assets.csv`);
}

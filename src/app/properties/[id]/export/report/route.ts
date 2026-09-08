import { notFound } from "next/navigation";
import { renderToStream } from "@react-pdf/renderer";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PropertyReportDocument } from "@/lib/pdf/property-report";

export async function GET(_request: Request, ctx: RouteContext<"/properties/[id]/export/report">) {
  await requireUser();
  const { id } = await ctx.params;

  const supabase = await createClient();
  const { data: property } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (!property) {
    notFound();
  }

  const [{ data: assets }, { data: records }, { data: warranties }, { data: expenses }] =
    await Promise.all([
      supabase
        .from("assets")
        .select("name, manufacturer, model_number, serial_number")
        .eq("property_id", id)
        .order("name"),
      supabase
        .from("records")
        .select("occurred_on, title, cost, record_types(label)")
        .eq("property_id", id)
        .order("occurred_on", { ascending: false }),
      supabase.from("warranties").select("provider, expires_on").eq("property_id", id).order("expires_on"),
      supabase
        .from("expenses")
        .select("expense_date, amount, tax_amount, category")
        .eq("property_id", id)
        .order("expense_date", { ascending: false }),
    ]);

  const stream = await renderToStream(
    PropertyReportDocument({
      property,
      assets: assets ?? [],
      records: records ?? [],
      warranties: warranties ?? [],
      expenses: expenses ?? [],
      generatedAt: new Date().toISOString().slice(0, 10),
    }),
  );

  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const pdfBuffer = Buffer.concat(chunks);

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${property.name.replace(/[^\w -]/g, "")}-report.pdf"`,
    },
  });
}

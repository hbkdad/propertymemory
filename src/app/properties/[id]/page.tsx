import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getAttachmentsByOwner, getAttachmentsForOwner } from "@/lib/attachments";
import { PropertyEditForm } from "./property-edit-form";
import { SpacesSection } from "./spaces-section";
import { RecordsSection } from "./records-section";
import { WarrantiesSection } from "@/components/warranties-section";
import { AttachmentsSection } from "@/components/attachments-section";
import { ExpensesSection } from "@/components/expenses-section";
import { RemindersSection } from "@/components/reminders-section";

export default async function PropertyDetailPage(props: PageProps<"/properties/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const supabase = await createClient();
  const [
    { data: property },
    { data: spaces },
    { data: assets },
    { data: recordTypes },
    { data: records },
    { data: warranties },
    { data: expenses },
    { data: reminders },
  ] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).maybeSingle(),
    supabase.from("spaces").select("*").eq("property_id", id).order("created_at"),
    supabase.from("assets").select("*").eq("property_id", id).order("created_at"),
    supabase.from("record_types").select("*").order("label"),
    supabase
      .from("records")
      .select("*, record_types(label), spaces(name), assets(name)")
      .eq("property_id", id)
      .order("occurred_on", { ascending: false }),
    // Only whole-property warranties -- asset-scoped ones show on the asset page.
    supabase.from("warranties").select("*").eq("property_id", id).is("asset_id", null).order("expires_on"),
    supabase.from("expenses").select("*").eq("property_id", id).order("expense_date", { ascending: false }),
    supabase.from("reminders").select("*").eq("property_id", id).order("due_on"),
  ]);

  if (!property) {
    notFound();
  }

  const [attachmentsWithUrls, attachmentsByRecordId, attachmentsByWarrantyId] = await Promise.all([
    getAttachmentsForOwner("property_id", property.id),
    getAttachmentsByOwner("record_id", (records ?? []).map((record) => record.id)),
    getAttachmentsByOwner("warranty_id", (warranties ?? []).map((warranty) => warranty.id)),
  ]);

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-zinc-500 underline">
          Back to properties
        </Link>
        <Link href={`/properties/${property.id}/visual`} className="text-sm underline">
          Visual view
        </Link>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{property.name}</h1>
      <PropertyEditForm property={property} />

      <SpacesSection
        propertyId={property.id}
        organizationId={property.organization_id}
        spaces={spaces ?? []}
      />

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Assets</h2>
        <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
          {assets?.map((asset) => (
            <li key={asset.id} className="py-2">
              <Link href={`/assets/${asset.id}`} className="text-sm font-medium underline">
                {asset.name}
              </Link>
              {asset.manufacturer && (
                <p className="text-xs text-zinc-500">
                  {asset.manufacturer} {asset.model_number ?? ""}
                </p>
              )}
            </li>
          ))}
          {assets?.length === 0 && (
            <li className="py-2 text-sm text-zinc-500">No assets yet.</li>
          )}
        </ul>
        <Link
          href={`/properties/${property.id}/assets/new`}
          className="mt-3 inline-block text-sm underline text-zinc-600 dark:text-zinc-400"
        >
          + Add an asset
        </Link>
      </section>

      <RecordsSection
        propertyId={property.id}
        organizationId={property.organization_id}
        recordTypes={recordTypes ?? []}
        spaces={spaces ?? []}
        assets={assets ?? []}
        records={records ?? []}
        attachmentsByRecordId={attachmentsByRecordId}
      />

      <WarrantiesSection
        propertyId={property.id}
        organizationId={property.organization_id}
        assetId={null}
        warranties={warranties ?? []}
        attachmentsByWarrantyId={attachmentsByWarrantyId}
      />

      <AttachmentsSection
        organizationId={property.organization_id}
        ownerColumn="property_id"
        ownerId={property.id}
        redirectPath={`/properties/${property.id}`}
        attachments={attachmentsWithUrls}
      />

      <ExpensesSection
        propertyId={property.id}
        organizationId={property.organization_id}
        expenses={expenses ?? []}
      />

      <RemindersSection
        propertyId={property.id}
        organizationId={property.organization_id}
        reminders={reminders ?? []}
      />

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Export</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Download your data -- for an insurer, a buyer, or just a backup.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            <a href={`/properties/${property.id}/export/report`} className="underline">
              Full property report (PDF)
            </a>
          </li>
          <li>
            <a href={`/properties/${property.id}/export/records`} className="underline">
              History (CSV)
            </a>
          </li>
          <li>
            <a href={`/properties/${property.id}/export/assets`} className="underline">
              Assets (CSV)
            </a>
          </li>
          <li>
            <a href={`/properties/${property.id}/export/expenses`} className="underline">
              Expenses (CSV)
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}

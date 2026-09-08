import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
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
    { data: attachments },
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
    supabase.from("attachments").select("*").eq("property_id", id).order("created_at"),
    supabase.from("expenses").select("*").eq("property_id", id).order("expense_date", { ascending: false }),
    supabase.from("reminders").select("*").eq("property_id", id).order("due_on"),
  ]);

  if (!property) {
    notFound();
  }

  const attachmentPaths = (attachments ?? []).map((attachment) => attachment.storage_path);
  const { data: signedUrls } =
    attachmentPaths.length > 0
      ? await supabase.storage.from("attachments").createSignedUrls(attachmentPaths, 300)
      : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signedUrls ?? []).map((entry) => [entry.path, entry.signedUrl]));
  const attachmentsWithUrls = (attachments ?? []).map((attachment) => ({
    ...attachment,
    url: urlByPath.get(attachment.storage_path) ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-500 underline">
        Back to properties
      </Link>
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
      />

      <WarrantiesSection
        propertyId={property.id}
        organizationId={property.organization_id}
        assetId={null}
        warranties={warranties ?? []}
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
    </div>
  );
}

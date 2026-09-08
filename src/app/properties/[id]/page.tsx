import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PropertyEditForm } from "./property-edit-form";
import { SpacesSection } from "./spaces-section";
import { RecordsSection } from "./records-section";

export default async function PropertyDetailPage(props: PageProps<"/properties/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const supabase = await createClient();
  const [{ data: property }, { data: spaces }, { data: assets }, { data: recordTypes }, { data: records }] =
    await Promise.all([
      supabase.from("properties").select("*").eq("id", id).maybeSingle(),
      supabase.from("spaces").select("*").eq("property_id", id).order("created_at"),
      supabase.from("assets").select("*").eq("property_id", id).order("created_at"),
      supabase.from("record_types").select("*").order("label"),
      supabase
        .from("records")
        .select("*, record_types(label), spaces(name), assets(name)")
        .eq("property_id", id)
        .order("occurred_on", { ascending: false }),
    ]);

  if (!property) {
    notFound();
  }

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
    </div>
  );
}

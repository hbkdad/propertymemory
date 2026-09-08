import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAsset } from "@/lib/actions/assets";
import { AssetForm } from "@/components/asset-form";

export default async function NewAssetPage(props: PageProps<"/properties/[id]/assets/new">) {
  await requireUser();
  const { id } = await props.params;

  const supabase = await createClient();
  const [{ data: property }, { data: categories }, { data: spaces }] = await Promise.all([
    supabase.from("properties").select("id, organization_id, name").eq("id", id).maybeSingle(),
    supabase.from("asset_categories").select("*").order("label"),
    supabase.from("spaces").select("*").eq("property_id", id).order("name"),
  ]);

  if (!property) {
    notFound();
  }

  const createWithIds = createAsset.bind(null, property.id, property.organization_id);

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <Link href={`/properties/${property.id}`} className="text-sm text-zinc-500 underline">
        Back to {property.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Add an asset</h1>
      <AssetForm
        action={createWithIds}
        organizationId={property.organization_id}
        propertyId={property.id}
        categories={categories ?? []}
        spaces={spaces ?? []}
        submitLabel="Add asset"
      />
    </div>
  );
}

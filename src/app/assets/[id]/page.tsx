import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateAsset } from "@/lib/actions/assets";
import { AssetForm } from "@/components/asset-form";
import { AssetDeleteButton } from "./asset-delete-button";

export default async function AssetDetailPage(props: PageProps<"/assets/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: asset } = await supabase.from("assets").select("*").eq("id", id).maybeSingle();

  if (!asset) {
    notFound();
  }

  const [{ data: categories }, { data: spaces }] = await Promise.all([
    supabase.from("asset_categories").select("*").order("label"),
    supabase.from("spaces").select("*").eq("property_id", asset.property_id).order("name"),
  ]);

  const updateWithIds = updateAsset.bind(null, asset.id, asset.property_id);

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <Link href={`/properties/${asset.property_id}`} className="text-sm text-zinc-500 underline">
        Back to property
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{asset.name}</h1>
      <AssetForm
        action={updateWithIds}
        categories={categories ?? []}
        spaces={spaces ?? []}
        initial={asset}
        submitLabel="Save changes"
      />
      <AssetDeleteButton assetId={asset.id} propertyId={asset.property_id} />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateAsset } from "@/lib/actions/assets";
import { AssetForm } from "@/components/asset-form";
import { AttachmentsSection } from "@/components/attachments-section";
import { AssetDeleteButton } from "./asset-delete-button";

export default async function AssetDetailPage(props: PageProps<"/assets/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: asset } = await supabase.from("assets").select("*").eq("id", id).maybeSingle();

  if (!asset) {
    notFound();
  }

  const [{ data: categories }, { data: spaces }, { data: attachments }] = await Promise.all([
    supabase.from("asset_categories").select("*").order("label"),
    supabase.from("spaces").select("*").eq("property_id", asset.property_id).order("name"),
    supabase.from("attachments").select("*").eq("asset_id", asset.id).order("created_at"),
  ]);

  const paths = (attachments ?? []).map((attachment) => attachment.storage_path);
  const { data: signedUrls } =
    paths.length > 0
      ? await supabase.storage.from("attachments").createSignedUrls(paths, 300)
      : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signedUrls ?? []).map((entry) => [entry.path, entry.signedUrl]));
  const attachmentsWithUrls = (attachments ?? []).map((attachment) => ({
    ...attachment,
    url: urlByPath.get(attachment.storage_path) ?? null,
  }));

  const updateWithIds = updateAsset.bind(null, asset.id, asset.property_id);
  const redirectPath = `/assets/${asset.id}`;

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

      <AttachmentsSection
        organizationId={asset.organization_id}
        ownerColumn="asset_id"
        ownerId={asset.id}
        redirectPath={redirectPath}
        attachments={attachmentsWithUrls}
      />
    </div>
  );
}

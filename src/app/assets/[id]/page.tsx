import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { updateAsset } from "@/lib/actions/assets";
import { AssetForm } from "@/components/asset-form";
import { AttachmentsSection } from "@/components/attachments-section";
import { WarrantiesSection } from "@/components/warranties-section";
import { getAttachmentsByOwner, getAttachmentsForOwner } from "@/lib/attachments";
import { assetUrl, generateQrSvg } from "@/lib/qr";
import { AssetDeleteButton } from "./asset-delete-button";

export default async function AssetDetailPage(props: PageProps<"/assets/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: asset } = await supabase.from("assets").select("*").eq("id", id).maybeSingle();

  if (!asset) {
    notFound();
  }

  const [{ data: categories }, { data: spaces }, { data: warranties }] = await Promise.all([
    supabase.from("asset_categories").select("*").order("label"),
    supabase.from("spaces").select("*").eq("property_id", asset.property_id).order("name"),
    supabase.from("warranties").select("*").eq("asset_id", asset.id).order("expires_on"),
  ]);

  const [attachmentsWithUrls, attachmentsByWarrantyId] = await Promise.all([
    getAttachmentsForOwner("asset_id", asset.id),
    getAttachmentsByOwner("warranty_id", (warranties ?? []).map((warranty) => warranty.id)),
  ]);

  const updateWithIds = updateAsset.bind(null, asset.id, asset.property_id);
  const redirectPath = `/assets/${asset.id}`;
  const url = await assetUrl(asset.id);
  const qrSvg = await generateQrSvg(url);

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <Link href={`/properties/${asset.property_id}`} className="text-sm text-zinc-500 underline">
        Back to property
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{asset.name}</h1>
      <AssetForm
        action={updateWithIds}
        organizationId={asset.organization_id}
        propertyId={asset.property_id}
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

      <WarrantiesSection
        propertyId={asset.property_id}
        organizationId={asset.organization_id}
        assetId={asset.id}
        warranties={warranties ?? []}
        attachmentsByWarrantyId={attachmentsByWarrantyId}
      />

      <section className="mt-10">
        <h2 className="text-lg font-semibold">QR label</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Scan to open this asset&apos;s page. Print a label to stick on the appliance itself.
        </p>
        <div
          className="mt-3 w-fit rounded-md bg-white p-2"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <p className="mt-2 break-all text-xs text-zinc-500">{url}</p>
        <Link href={`/assets/${asset.id}/label`} className="mt-2 inline-block text-sm underline">
          Print label
        </Link>
      </section>
    </div>
  );
}

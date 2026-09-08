import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { assetUrl, generateQrSvg } from "@/lib/qr";
import { PrintButton } from "./print-button";

export default async function AssetLabelPage(props: PageProps<"/assets/[id]/label">) {
  await requireUser();
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: asset } = await supabase
    .from("assets")
    .select("id, name, manufacturer, model_number")
    .eq("id", id)
    .maybeSingle();

  if (!asset) {
    notFound();
  }

  const qrSvg = await generateQrSvg(await assetUrl(asset.id));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xs flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="w-fit rounded-md bg-white p-3" dangerouslySetInnerHTML={{ __html: qrSvg }} />
      <p className="font-medium text-black dark:text-white">{asset.name}</p>
      {(asset.manufacturer || asset.model_number) && (
        <p className="text-sm text-zinc-500">
          {[asset.manufacturer, asset.model_number].filter(Boolean).join(" -- ")}
        </p>
      )}
      <PrintButton />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { PropertyEditForm } from "./property-edit-form";

export default async function PropertyDetailPage(props: PageProps<"/properties/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: property } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();

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
    </div>
  );
}

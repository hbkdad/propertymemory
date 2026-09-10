import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getRoomPicker } from "@/lib/visual-property";

export default async function VisualRoomsPage(props: PageProps<"/properties/[id]/visual/rooms">) {
  await requireUser();
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: property } = await supabase.from("properties").select("id, name").eq("id", id).maybeSingle();
  if (!property) {
    notFound();
  }

  const rooms = await getRoomPicker(id);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link href={`/properties/${id}/visual`} className="text-sm text-zinc-500 underline">
        &larr; {property.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Where to?</h1>
      <p className="mt-1 text-sm text-zinc-500">Select an area to walk through.</p>

      {rooms.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          <p>No spaces yet -- add one from Property Records first (e.g. Kitchen, Basement), then come back here to add photos and hotspots.</p>
          <Link href={`/properties/${id}#spaces`} className="mt-3 inline-block underline">
            Go to Property Records
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {rooms.map(({ space, coverPhotoUrl, hotspotCount }) => (
            <li key={space.id}>
              <Link
                href={`/properties/${id}/visual/${space.id}`}
                className="block overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"
              >
                <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-900">
                  {coverPhotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPhotoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium">{space.name}</span>
                  <span className="text-xs text-zinc-500">{hotspotCount} items</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

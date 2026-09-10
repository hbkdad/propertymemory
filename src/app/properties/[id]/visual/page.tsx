import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getPropertyHero } from "@/lib/visual-property";
import { propertyTypeLabels } from "@/lib/validations/property";

export default async function PropertyVisualPage(props: PageProps<"/properties/[id]/visual">) {
  await requireUser();
  const { id } = await props.params;

  const hero = await getPropertyHero(id);
  if (!hero) {
    notFound();
  }

  const { property, coverPhotoUrl, stats } = hero;
  const statList = [
    stats.units > 0 ? { label: "Units", value: stats.units } : null,
    { label: "Rooms", value: stats.rooms },
    { label: "Assets", value: stats.assets },
    { label: "Records", value: stats.records },
  ].filter((stat): stat is { label: string; value: number } => stat !== null);

  return (
    <div className="relative min-h-screen">
      {coverPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- see docs/decisions/0006 on why plain <img>, not next/image
        <img src={coverPhotoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

      <div className="relative flex min-h-screen flex-col justify-end px-6 py-10 text-white sm:px-10 sm:py-14">
        <Link href={`/properties/${property.id}`} className="mb-8 w-fit text-sm text-white/70 underline">
          &larr; Property Records
        </Link>

        <p className="text-xs font-medium uppercase tracking-wide text-white/60">
          {propertyTypeLabels[property.property_type as keyof typeof propertyTypeLabels] ?? property.property_type}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">{property.name}</h1>
        {(property.city || property.region) && (
          <p className="mt-1 text-white/80">{[property.city, property.region].filter(Boolean).join(", ")}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
          {statList.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
              <p className="text-xs uppercase tracking-wide text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/properties/${property.id}/visual/rooms`}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900"
          >
            Enter Property
          </Link>
          <Link
            href={`/properties/${property.id}`}
            className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium backdrop-blur-sm"
          >
            Property Records
          </Link>
          <Link
            href={`/properties/${property.id}#records`}
            className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium backdrop-blur-sm"
          >
            Add Record
          </Link>
          <Link
            href="/search"
            className="rounded-md border border-white/40 px-4 py-2 text-sm font-medium backdrop-blur-sm"
          >
            Search Property
          </Link>
        </div>
      </div>
    </div>
  );
}

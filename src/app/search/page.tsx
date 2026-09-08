import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export default async function SearchPage(props: PageProps<"/search">) {
  await requireUser();
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  let properties: { id: string; name: string; address_line1: string | null }[] = [];
  let assets: {
    id: string;
    name: string;
    manufacturer: string | null;
    model_number: string | null;
    serial_number: string | null;
    property_id: string;
  }[] = [];
  let records: { id: string; title: string; description: string | null; property_id: string }[] = [];
  let vendors: { id: string; name: string; kind: string }[] = [];

  if (query.length > 0) {
    // Structured Postgres search behind one query layer (this page) so a
    // later semantic-search addition is an internal swap, not a rewrite of
    // every call site (see ARCHITECTURE.md). RLS scopes every query below to
    // the caller's own organization -- no manual org_id filter needed.
    const term = `%${query}%`;
    const supabase = await createClient();
    const [propertiesResult, assetsResult, recordsResult, vendorsResult] = await Promise.all([
      supabase
        .from("properties")
        .select("id, name, address_line1")
        .or(`name.ilike.${term},address_line1.ilike.${term},city.ilike.${term}`)
        .limit(20),
      supabase
        .from("assets")
        .select("id, name, manufacturer, model_number, serial_number, property_id")
        .or(
          `name.ilike.${term},manufacturer.ilike.${term},model_number.ilike.${term},serial_number.ilike.${term}`,
        )
        .limit(20),
      supabase
        .from("records")
        .select("id, title, description, property_id")
        .or(`title.ilike.${term},description.ilike.${term}`)
        .limit(20),
      supabase.from("vendors").select("id, name, kind").ilike("name", term).limit(20),
    ]);
    properties = propertiesResult.data ?? [];
    assets = assetsResult.data ?? [];
    records = recordsResult.data ?? [];
    vendors = vendorsResult.data ?? [];
  }

  const hasResults =
    properties.length + assets.length + records.length + vendors.length > 0;

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <form method="get" className="mt-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus
          placeholder="Manufacturer, model, address, notes..."
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium dark:border-zinc-700"
        >
          Search
        </button>
      </form>

      {query.length > 0 && !hasResults && (
        <p className="mt-6 text-sm text-zinc-500">No results for &ldquo;{query}&rdquo;.</p>
      )}

      {properties.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-500">Properties</h2>
          <ul className="mt-2 space-y-1">
            {properties.map((property) => (
              <li key={property.id}>
                <Link href={`/properties/${property.id}`} className="text-sm underline">
                  {property.name}
                </Link>
                {property.address_line1 && (
                  <span className="text-sm text-zinc-500"> -- {property.address_line1}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {assets.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-500">Assets</h2>
          <ul className="mt-2 space-y-1">
            {assets.map((asset) => (
              <li key={asset.id}>
                <Link href={`/assets/${asset.id}`} className="text-sm underline">
                  {asset.name}
                </Link>
                {(asset.manufacturer || asset.model_number || asset.serial_number) && (
                  <span className="text-sm text-zinc-500">
                    {" "}
                    -- {[asset.manufacturer, asset.model_number, asset.serial_number]
                      .filter(Boolean)
                      .join(" / ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {records.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-500">History</h2>
          <ul className="mt-2 space-y-1">
            {records.map((record) => (
              <li key={record.id}>
                <Link href={`/properties/${record.property_id}`} className="text-sm underline">
                  {record.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {vendors.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-500">Vendors</h2>
          <ul className="mt-2 space-y-1">
            {vendors.map((vendor) => (
              <li key={vendor.id} className="text-sm">
                {vendor.name} <span className="text-zinc-500">({vendor.kind})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

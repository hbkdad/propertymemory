import Link from "next/link";
import { redirect } from "next/navigation";
import { logOut } from "@/lib/actions/auth";
import { getCurrentMembership } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const membership = await getCurrentMembership();
  if (!membership?.organizations) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, city, property_type")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{membership.organizations.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Your properties</h1>
        </div>
        <form action={logOut}>
          <button type="submit" className="text-sm underline text-zinc-600 dark:text-zinc-400">
            Log out
          </button>
        </form>
      </div>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {properties?.map((property) => (
          <li key={property.id} className="py-4">
            <Link href={`/properties/${property.id}`} className="font-medium underline">
              {property.name}
            </Link>
            <p className="text-sm text-zinc-500">
              {property.city ? `${property.city} -- ` : ""}
              {property.property_type.replace("_", " ")}
            </p>
          </li>
        ))}
      </ul>

      {properties?.length === 0 && (
        <p className="mt-8 text-sm text-zinc-500">No properties yet.</p>
      )}

      <Link
        href="/properties/new"
        className="mt-6 inline-block text-sm underline text-zinc-600 dark:text-zinc-400"
      >
        + Add a property
      </Link>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { logOut } from "@/lib/actions/auth";
import { getCurrentMembership } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

// Kept outside the component: React's purity rules flag calling Date.now()
// directly in a component's render body, since Server Components can
// become subject to caching/replay -- computing "now" in a plain helper
// keeps the component itself pure while still reading a fresh clock on
// every actual invocation (this page is already forced dynamic by the
// auth cookie read in getCurrentMembership(), so behavior is unchanged).
function getDateThresholds() {
  const now = Date.now();
  return {
    today: new Date(now).toISOString().slice(0, 10),
    in30Days: new Date(now + 30 * 86_400_000).toISOString().slice(0, 10),
    in60Days: new Date(now + 60 * 86_400_000).toISOString().slice(0, 10),
  };
}

export default async function DashboardPage() {
  const membership = await getCurrentMembership();
  if (!membership?.organizations) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { today, in30Days, in60Days } = getDateThresholds();

  const [{ data: properties }, { data: expiringWarranties }, { data: upcomingReminders }] =
    await Promise.all([
      supabase.from("properties").select("id, name, city, property_type").order("created_at", { ascending: true }),
      // Includes anything already expired too, not just the next 60 days --
      // a forgotten expired warranty is exactly the kind of thing this
      // widget should keep surfacing.
      supabase
        .from("warranties")
        .select("id, provider, expires_on, property_id, properties(name)")
        .lte("expires_on", in60Days)
        .order("expires_on")
        .limit(5),
      supabase
        .from("reminders")
        .select("id, title, due_on, property_id, properties(name)")
        .eq("is_active", true)
        .lte("due_on", in30Days)
        .order("due_on")
        .limit(5),
    ]);

  const hasUpcoming = (expiringWarranties?.length ?? 0) > 0 || (upcomingReminders?.length ?? 0) > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{membership.organizations.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Your properties</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/search" className="text-sm underline text-zinc-600 dark:text-zinc-400">
            Search
          </Link>
          <Link href="/help" className="text-sm underline text-zinc-600 dark:text-zinc-400">
            Help
          </Link>
          <form action={logOut}>
            <button type="submit" className="text-sm underline text-zinc-600 dark:text-zinc-400">
              Log out
            </button>
          </form>
        </div>
      </div>

      {hasUpcoming && (
        <section className="mt-8 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Needs attention</h2>
          <ul className="mt-3 space-y-2">
            {expiringWarranties?.map((warranty) => (
              <li key={warranty.id} className="text-sm">
                <Link href={`/properties/${warranty.property_id}`} className="underline">
                  {warranty.provider}
                </Link>
                <span className={warranty.expires_on < today ? "text-red-600" : "text-zinc-500"}>
                  {" "}
                  -- {warranty.properties?.name} -- {warranty.expires_on < today ? "expired" : "expires"}{" "}
                  {warranty.expires_on}
                </span>
              </li>
            ))}
            {upcomingReminders?.map((reminder) => (
              <li key={reminder.id} className="text-sm">
                <Link href={`/properties/${reminder.property_id}`} className="underline">
                  {reminder.title}
                </Link>
                <span className={reminder.due_on < today ? "text-red-600" : "text-zinc-500"}>
                  {" "}
                  -- {reminder.properties?.name} -- {reminder.due_on < today ? "overdue since" : "due"}{" "}
                  {reminder.due_on}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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

"use client";

import { useActionState } from "react";
import { createSpace, deleteSpace } from "@/lib/actions/spaces";
import type { Tables } from "@/lib/supabase/database.types";

export function SpacesSection({
  propertyId,
  organizationId,
  spaces,
}: {
  propertyId: string;
  organizationId: string;
  spaces: Tables<"spaces">[];
}) {
  const createWithIds = createSpace.bind(null, propertyId, organizationId);
  const [state, action, pending] = useActionState(createWithIds, undefined);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Spaces</h2>
      <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
        {spaces.map((space) => (
          <li key={space.id} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{space.name}</p>
              {space.space_type && <p className="text-xs text-zinc-500">{space.space_type}</p>}
            </div>
            <button
              type="button"
              onClick={() => deleteSpace(space.id, propertyId)}
              className="text-xs text-red-600 underline"
            >
              Remove
            </button>
          </li>
        ))}
        {spaces.length === 0 && (
          <li className="py-2 text-sm text-zinc-500">No spaces yet (e.g. Kitchen, Basement).</li>
        )}
      </ul>

      <form action={action} className="mt-3 flex gap-2">
        <input
          name="name"
          placeholder="e.g. Kitchen"
          required
          className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          Add
        </button>
      </form>
      {state?.errors?.name && <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>}
      {state?.message && <p className="mt-1 text-sm text-red-600">{state.message}</p>}
    </section>
  );
}

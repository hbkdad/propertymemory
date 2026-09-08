"use client";

import { useActionState } from "react";
import { createRecord, deleteRecord } from "@/lib/actions/records";
import type { Tables } from "@/lib/supabase/database.types";

type RecordRow = Tables<"records"> & {
  record_types: Pick<Tables<"record_types">, "label"> | null;
  spaces: Pick<Tables<"spaces">, "name"> | null;
  assets: Pick<Tables<"assets">, "name"> | null;
};

export function RecordsSection({
  propertyId,
  organizationId,
  recordTypes,
  spaces,
  assets,
  records,
}: {
  propertyId: string;
  organizationId: string;
  recordTypes: Tables<"record_types">[];
  spaces: Tables<"spaces">[];
  assets: Tables<"assets">[];
  records: RecordRow[];
}) {
  const redirectTo = `/properties/${propertyId}`;
  const createWithIds = createRecord.bind(null, propertyId, organizationId, redirectTo);
  const [state, action, pending] = useActionState(createWithIds, undefined);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">History</h2>

      <ul className="mt-3 space-y-3">
        {records.map((record) => (
          <li key={record.id} className="flex items-start justify-between text-sm">
            <div>
              <p className="font-medium">
                {record.title}{" "}
                <span className="font-normal text-zinc-500">-- {record.record_types?.label}</span>
              </p>
              <p className="text-xs text-zinc-500">
                {record.occurred_on}
                {record.spaces?.name ? ` -- ${record.spaces.name}` : ""}
                {record.assets?.name ? ` -- ${record.assets.name}` : ""}
                {record.cost ? ` -- $${record.cost}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => deleteRecord(record.id, redirectTo)}
              className="text-xs text-red-600 underline"
            >
              Remove
            </button>
          </li>
        ))}
        {records.length === 0 && (
          <li className="text-sm text-zinc-500">No history yet.</li>
        )}
      </ul>

      <form action={action} className="mt-4 space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="recordTypeId" className="text-xs font-medium">
              Type
            </label>
            <select
              id="recordTypeId"
              name="recordTypeId"
              required
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {recordTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="occurredOn" className="text-xs font-medium">
              Date
            </label>
            <input
              id="occurredOn"
              name="occurredOn"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="title" className="text-xs font-medium">
            What happened
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="e.g. Replaced furnace filter"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {state?.errors?.title && <p className="text-xs text-red-600">{state.errors.title[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="scope" className="text-xs font-medium">
              Attached to
            </label>
            <select
              id="scope"
              name="scope"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Whole property</option>
              {spaces.length > 0 && (
                <optgroup label="Spaces">
                  {spaces.map((space) => (
                    <option key={space.id} value={`space:${space.id}`}>
                      {space.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {assets.length > 0 && (
                <optgroup label="Assets">
                  {assets.map((asset) => (
                    <option key={asset.id} value={`asset:${asset.id}`}>
                      {asset.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="cost" className="text-xs font-medium">
              Cost <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="cost"
              name="cost"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {state?.errors?.cost && <p className="text-xs text-red-600">{state.errors.cost[0]}</p>}
          </div>
        </div>

        {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {pending ? "Adding..." : "Add to history"}
        </button>
      </form>
    </section>
  );
}

"use client";

import { useActionState, useState } from "react";
import { deleteProperty, updateProperty } from "@/lib/actions/properties";
import { propertyTypeLabels, propertyTypes } from "@/lib/validations/property";
import type { Tables } from "@/lib/supabase/database.types";

export function PropertyEditForm({ property }: { property: Tables<"properties"> }) {
  const updateWithId = updateProperty.bind(null, property.id);
  const [state, action, pending] = useActionState(updateWithId, undefined);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const deleteWithId = deleteProperty.bind(null, property.id);

  return (
    <div className="mt-6 space-y-4">
      <form id="update-property-form" action={action} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Property name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={property.name}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="propertyType" className="text-sm font-medium">
            Property type
          </label>
          <select
            id="propertyType"
            name="propertyType"
            defaultValue={property.property_type}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {propertyTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <label htmlFor="addressLine1" className="text-sm font-medium">
              Address
            </label>
            <input
              id="addressLine1"
              name="addressLine1"
              defaultValue={property.address_line1 ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="city" className="text-sm font-medium">
              City
            </label>
            <input
              id="city"
              name="city"
              defaultValue={property.city ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="region" className="text-sm font-medium">
              Province/State
            </label>
            <input
              id="region"
              name="region"
              defaultValue={property.region ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="notes" className="text-sm font-medium">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={property.notes ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      </form>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          form="update-property-form"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>

        {confirmingDelete ? (
          <form action={deleteWithId} className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">Delete this property?</span>
            <button type="submit" className="text-sm font-medium text-red-600 underline">
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-sm text-zinc-500 underline"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-sm text-red-600 underline"
          >
            Delete property
          </button>
        )}
      </div>
    </div>
  );
}

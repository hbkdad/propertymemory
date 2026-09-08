"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createProperty } from "@/lib/actions/properties";
import { propertyTypeLabels, propertyTypes } from "@/lib/validations/property";

export default function NewPropertyPage() {
  const [state, action, pending] = useActionState(createProperty, undefined);

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Add a property</h1>

      <form action={action} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Property name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. 12 Main Street"
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
            defaultValue="single_family"
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
              Address <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="addressLine1"
              name="addressLine1"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="city" className="text-sm font-medium">
              City <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="city"
              name="city"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="region" className="text-sm font-medium">
              Province/State <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="region"
              name="region"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {pending ? "Saving..." : "Add property"}
          </button>
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

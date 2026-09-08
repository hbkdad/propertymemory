"use client";

import { useActionState, useState } from "react";
import type { AssetFormState } from "@/lib/actions/assets";
import { extractApplianceLabelAction } from "@/lib/actions/extraction";
import type { ApplianceLabelExtraction } from "@/lib/extraction";
import type { Tables } from "@/lib/supabase/database.types";
import { ScanButton } from "./scan-button";

type BoundAction = (state: AssetFormState, formData: FormData) => Promise<AssetFormState>;

export function AssetForm({
  action: boundAction,
  organizationId,
  propertyId,
  categories,
  spaces,
  initial,
  submitLabel,
}: {
  action: BoundAction;
  organizationId: string;
  propertyId: string;
  categories: Tables<"asset_categories">[];
  spaces: Tables<"spaces">[];
  initial?: Tables<"assets">;
  submitLabel: string;
}) {
  const [state, action, pending] = useActionState(boundAction, undefined);
  const [manufacturer, setManufacturer] = useState(initial?.manufacturer ?? "");
  const [modelNumber, setModelNumber] = useState(initial?.model_number ?? "");
  const [serialNumber, setSerialNumber] = useState(initial?.serial_number ?? "");

  function handleScanned(data: ApplianceLabelExtraction) {
    if (data.manufacturer) setManufacturer(data.manufacturer);
    if (data.modelNumber) setModelNumber(data.modelNumber);
    if (data.serialNumber) setSerialNumber(data.serialNumber);
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Asset name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initial?.name}
          placeholder="e.g. Kitchen dishwasher"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="assetCategoryId" className="text-sm font-medium">
            Category
          </label>
          <select
            id="assetCategoryId"
            name="assetCategoryId"
            defaultValue={initial?.asset_category_id ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">--</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="spaceId" className="text-sm font-medium">
            Space
          </label>
          <select
            id="spaceId"
            name="spaceId"
            defaultValue={initial?.space_id ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Whole property</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ScanButton
        label="Scan the appliance label"
        action={extractApplianceLabelAction.bind(null, organizationId, propertyId)}
        onResult={handleScanned}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="manufacturer" className="text-sm font-medium">
            Manufacturer
          </label>
          <input
            id="manufacturer"
            name="manufacturer"
            value={manufacturer}
            onChange={(event) => setManufacturer(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="modelNumber" className="text-sm font-medium">
            Model number
          </label>
          <input
            id="modelNumber"
            name="modelNumber"
            value={modelNumber}
            onChange={(event) => setModelNumber(event.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="serialNumber" className="text-sm font-medium">
          Serial number
        </label>
        <input
          id="serialNumber"
          name="serialNumber"
          value={serialNumber}
          onChange={(event) => setSerialNumber(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="installedOn" className="text-sm font-medium">
            Installed
          </label>
          <input
            id="installedOn"
            name="installedOn"
            type="date"
            defaultValue={initial?.installed_on ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="purchasedOn" className="text-sm font-medium">
            Purchased
          </label>
          <input
            id="purchasedOn"
            name="purchasedOn"
            type="date"
            defaultValue={initial?.purchased_on ?? ""}
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
          defaultValue={initial?.notes ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

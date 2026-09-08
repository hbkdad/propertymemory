"use client";

import { useActionState } from "react";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { propertyTypes } from "@/lib/validations/onboarding";

const PROPERTY_TYPE_LABELS: Record<(typeof propertyTypes)[number], string> = {
  single_family: "Single-family home",
  condo: "Condo",
  multi_unit: "Multi-unit / rental",
  commercial: "Commercial",
  other: "Other",
};

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(completeOnboarding, undefined);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <form action={action} className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s set up your first property</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Just enough to get started -- you can fill in the rest later.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="accountName" className="text-sm font-medium">
            Your name or household/company name
          </label>
          <input
            id="accountName"
            name="accountName"
            required
            placeholder="e.g. The Lavigne Household"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {state?.errors?.accountName && (
            <p className="text-sm text-red-600">{state.errors.accountName[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="propertyName" className="text-sm font-medium">
            Property name
          </label>
          <input
            id="propertyName"
            name="propertyName"
            required
            placeholder="e.g. 12 Main Street"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          {state?.errors?.propertyName && (
            <p className="text-sm text-red-600">{state.errors.propertyName[0]}</p>
          )}
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
                {PROPERTY_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
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
        </div>

        {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Setting up..." : "Create my property"}
        </button>
      </form>
    </div>
  );
}

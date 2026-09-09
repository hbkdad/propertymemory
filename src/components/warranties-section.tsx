"use client";

import { useActionState, useState } from "react";
import { createWarranty, deleteWarranty } from "@/lib/actions/warranties";
import { AttachmentsSection } from "@/components/attachments-section";
import type { AttachmentWithUrl } from "@/lib/attachments";
import type { Tables } from "@/lib/supabase/database.types";

function isExpiringSoon(expiresOn: string) {
  const days = (new Date(expiresOn).getTime() - Date.now()) / 86_400_000;
  return days < 60;
}

export function WarrantiesSection({
  propertyId,
  organizationId,
  assetId,
  warranties,
  attachmentsByWarrantyId,
}: {
  propertyId: string;
  organizationId: string;
  assetId: string | null;
  warranties: Tables<"warranties">[];
  attachmentsByWarrantyId: Map<string, AttachmentWithUrl[]>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const redirectPath = assetId ? `/assets/${assetId}` : `/properties/${propertyId}`;
  const createWithIds = createWarranty.bind(null, propertyId, organizationId, assetId, redirectPath);
  const [state, action, pending] = useActionState(createWithIds, undefined);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Warranties</h2>
      <ul className="mt-3 space-y-2">
        {warranties.map((warranty) => {
          const expiring = isExpiringSoon(warranty.expires_on);
          const warrantyAttachments = attachmentsByWarrantyId.get(warranty.id) ?? [];
          const expanded = expandedId === warranty.id;
          return (
            <li key={warranty.id} className="text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{warranty.provider}</p>
                  <p className={`text-xs ${expiring ? "text-amber-600" : "text-zinc-500"}`}>
                    Expires {warranty.expires_on}
                    {expiring ? " -- expiring soon" : ""}
                    {warranty.policy_number ? ` -- #${warranty.policy_number}` : ""}
                  </p>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : warranty.id)}
                    className="mt-1 text-xs text-zinc-500 underline"
                  >
                    {expanded ? "Hide attachments" : `Attachments (${warrantyAttachments.length})`}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => deleteWarranty(warranty.id, redirectPath)}
                  className="text-xs text-red-600 underline"
                >
                  Remove
                </button>
              </div>
              {expanded && (
                <AttachmentsSection
                  organizationId={organizationId}
                  ownerColumn="warranty_id"
                  ownerId={warranty.id}
                  redirectPath={redirectPath}
                  attachments={warrantyAttachments}
                />
              )}
            </li>
          );
        })}
        {warranties.length === 0 && <li className="text-sm text-zinc-500">No warranties yet.</li>}
      </ul>

      <form
        action={action}
        className="mt-4 space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="provider" className="text-xs font-medium">
              Provider
            </label>
            <input
              id="provider"
              name="provider"
              required
              placeholder="e.g. Whirlpool"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {state?.errors?.provider && (
              <p className="text-xs text-red-600">{state.errors.provider[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="policyNumber" className="text-xs font-medium">
              Policy # <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="policyNumber"
              name="policyNumber"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="startsOn" className="text-xs font-medium">
              Starts <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="startsOn"
              name="startsOn"
              type="date"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="expiresOn" className="text-xs font-medium">
              Expires
            </label>
            <input
              id="expiresOn"
              name="expiresOn"
              type="date"
              required
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {state?.errors?.expiresOn && (
              <p className="text-xs text-red-600">{state.errors.expiresOn[0]}</p>
            )}
          </div>
        </div>

        {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {pending ? "Adding..." : "Add warranty"}
        </button>
      </form>
    </section>
  );
}

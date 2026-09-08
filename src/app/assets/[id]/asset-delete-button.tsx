"use client";

import { useState } from "react";
import { deleteAsset } from "@/lib/actions/assets";

export function AssetDeleteButton({ assetId, propertyId }: { assetId: string; propertyId: string }) {
  const [confirming, setConfirming] = useState(false);
  const deleteWithIds = deleteAsset.bind(null, assetId, propertyId);

  if (confirming) {
    return (
      <form action={deleteWithIds} className="mt-4 flex items-center gap-3">
        <span className="text-sm text-zinc-500">Delete this asset?</span>
        <button type="submit" className="text-sm font-medium text-red-600 underline">
          Yes, delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm text-zinc-500 underline"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="mt-4 text-sm text-red-600 underline"
    >
      Delete asset
    </button>
  );
}

"use client";

import { useActionState } from "react";
import { deleteAttachment, uploadAttachment } from "@/lib/actions/attachments";
import type { AttachmentOwnerColumn } from "@/lib/validations/attachment";
import type { Tables } from "@/lib/supabase/database.types";

export function AttachmentsSection({
  organizationId,
  ownerColumn,
  ownerId,
  redirectPath,
  attachments,
}: {
  organizationId: string;
  ownerColumn: AttachmentOwnerColumn;
  ownerId: string;
  redirectPath: string;
  attachments: (Tables<"attachments"> & { url: string | null })[];
}) {
  const uploadWithIds = uploadAttachment.bind(null, organizationId, ownerColumn, ownerId, redirectPath);
  const [state, action, pending] = useActionState(uploadWithIds, undefined);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Attachments</h2>
      <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
        {attachments.map((attachment) => (
          <li key={attachment.id} className="flex items-center justify-between py-2 text-sm">
            {attachment.url ? (
              <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="underline">
                {attachment.file_name}
              </a>
            ) : (
              <span>{attachment.file_name}</span>
            )}
            <button
              type="button"
              onClick={() => deleteAttachment(attachment.id, attachment.storage_path, redirectPath)}
              className="text-xs text-red-600 underline"
            >
              Remove
            </button>
          </li>
        ))}
        {attachments.length === 0 && (
          <li className="py-2 text-sm text-zinc-500">No attachments yet.</li>
        )}
      </ul>

      <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          required
          className="text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {pending ? "Uploading..." : "Upload"}
        </button>
      </form>
      {state?.message && <p className="mt-1 text-sm text-red-600">{state.message}</p>}
    </section>
  );
}

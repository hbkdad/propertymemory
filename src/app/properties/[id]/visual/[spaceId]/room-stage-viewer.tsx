"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { deleteAttachment, setCoverPhoto, uploadRoomPhoto } from "@/lib/actions/attachments";
import { createAnnotation, deleteAnnotation, linkAnnotationAsset } from "@/lib/actions/visual-annotations";
import { downscaleForUpload } from "@/lib/image";
import type { StageAsset, StagePhoto } from "@/lib/visual-property";
import type { Tables } from "@/lib/supabase/database.types";

type DraftShape = { type: "point"; x: number; y: number } | { type: "rectangle"; x: number; y: number; w: number; h: number };

export function RoomStageViewer({
  propertyId,
  propertyName,
  organizationId,
  space,
  photos,
  assets,
}: {
  propertyId: string;
  propertyName: string;
  organizationId: string;
  space: Tables<"spaces">;
  photos: StagePhoto[];
  assets: { id: string; name: string; space_id: string | null }[];
}) {
  const redirectPath = `/properties/${propertyId}/visual/${space.id}`;
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<DraftShape | null>(null);
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  const photo = photos[activeIndex] as StagePhoto | undefined;
  const selected = photo?.annotations.find((a) => a.id === selectedAnnotationId) ?? null;

  function pointFromEvent(event: React.MouseEvent): { x: number; y: number } {
    const rect = stageRef.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    return { x, y };
  }

  function handleStageMouseDown(event: React.MouseEvent) {
    if (!isPlacing) return;
    setDragStart(pointFromEvent(event));
    setDraft(null);
  }

  function handleStageMouseMove(event: React.MouseEvent) {
    if (!isPlacing || !dragStart) return;
    const current = pointFromEvent(event);
    const x = Math.min(dragStart.x, current.x);
    const y = Math.min(dragStart.y, current.y);
    const w = Math.abs(current.x - dragStart.x);
    const h = Math.abs(current.y - dragStart.y);
    setDraft(w > 0.01 || h > 0.01 ? { type: "rectangle", x, y, w, h } : { type: "point", x: dragStart.x, y: dragStart.y });
  }

  function handleStageMouseUp() {
    if (!isPlacing || !dragStart) return;
    if (!draft) {
      // A click with no meaningful drag -- treat as a point hotspot at that spot.
      setDraft({ type: "point", x: dragStart.x, y: dragStart.y });
    }
    setDragStart(null);
  }

  function cancelPlacing() {
    setIsPlacing(false);
    setDragStart(null);
    setDraft(null);
  }

  // Keyboard-only path for placing a hotspot, since dragging a box has no
  // pointer equivalent otherwise (CLAUDE.md/Section 51: every interactive
  // control needs a keyboard route, "hotspot navigation where practical").
  // Enter/Space drops a default-sized box roughly in the middle of the
  // photo; arrow keys nudge it, Shift+arrow resizes it, before it's saved
  // through the same label/asset form the mouse path uses.
  const NUDGE = 0.02;
  const MIN_SIZE = 0.04;
  function handleStageKeyDown(event: React.KeyboardEvent) {
    if (!isPlacing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      cancelPlacing();
      return;
    }
    if (!draft && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setDraft({ type: "rectangle", x: 0.4, y: 0.4, w: 0.2, h: 0.2 });
      return;
    }
    if (draft && draft.type === "rectangle" && event.key.startsWith("Arrow")) {
      event.preventDefault();
      setDraft((prev) => {
        if (!prev || prev.type !== "rectangle") return prev;
        if (event.shiftKey) {
          const grow = event.key === "ArrowRight" || event.key === "ArrowDown" ? NUDGE : -NUDGE;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            const w = Math.min(1 - prev.x, Math.max(MIN_SIZE, prev.w + grow));
            return { ...prev, w };
          }
          const h = Math.min(1 - prev.y, Math.max(MIN_SIZE, prev.h + grow));
          return { ...prev, h };
        }
        const dx = event.key === "ArrowLeft" ? -NUDGE : event.key === "ArrowRight" ? NUDGE : 0;
        const dy = event.key === "ArrowUp" ? -NUDGE : event.key === "ArrowDown" ? NUDGE : 0;
        return {
          ...prev,
          x: Math.min(1 - prev.w, Math.max(0, prev.x + dx)),
          y: Math.min(1 - prev.h, Math.max(0, prev.y + dy)),
        };
      });
    }
  }

  async function saveHotspot(formData: FormData) {
    if (!draft || !photo) return;
    const label = String(formData.get("label") ?? "").trim();
    if (!label) return;
    const assetId = String(formData.get("assetId") ?? "");
    const coordinates =
      draft.type === "point"
        ? { x: draft.x, y: draft.y }
        : { x: draft.x, y: draft.y, w: draft.w, h: draft.h };

    const body = new FormData();
    body.set("annotationType", draft.type);
    body.set("coordinates", JSON.stringify(coordinates));
    body.set("label", label);
    if (assetId) body.set("assetId", assetId);

    setCreating(true);
    await createAnnotation(organizationId, photo.id, redirectPath, undefined, body);
    setCreating(false);
    cancelPlacing();
  }

  async function handlePhotoUpload(formData: FormData) {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return;
    const { file: resized, width, height } = await downscaleForUpload(file, 1920);
    const body = new FormData();
    body.set("file", resized);
    if (width) body.set("width", String(width));
    if (height) body.set("height", String(height));
    await uploadRoomPhoto(organizationId, space.id, redirectPath, undefined, body);
  }

  const [, uploadAction, uploadPending] = useActionState(
    async (_state: undefined, formData: FormData) => {
      await handlePhotoUpload(formData);
      return undefined;
    },
    undefined,
  );

  function renderHotspotStyle(coords: Record<string, number | number[][]>) {
    if (typeof coords.w === "number") {
      return {
        left: `${(coords.x as number) * 100}%`,
        top: `${(coords.y as number) * 100}%`,
        width: `${(coords.w as number) * 100}%`,
        height: `${(coords.h as number) * 100}%`,
      };
    }
    return {
      left: `${(coords.x as number) * 100 - 2}%`,
      top: `${(coords.y as number) * 100 - 2}%`,
      width: "4%",
      height: "4%",
      borderRadius: "9999px",
    };
  }

  return (
    <div className="relative min-h-screen bg-zinc-950">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent p-4 text-sm text-white/80">
        <div className="flex flex-wrap items-center gap-1">
          <Link href={`/properties/${propertyId}/visual`} className="underline">
            {propertyName}
          </Link>
          <span>&rsaquo;</span>
          <Link href={`/properties/${propertyId}/visual/rooms`} className="underline">
            Areas
          </Link>
          <span>&rsaquo;</span>
          <span className="font-medium text-white">{space.name}</span>
          {selected && (
            <>
              <span>&rsaquo;</span>
              <span className="font-medium text-white">{selected.label}</span>
            </>
          )}
        </div>
        <Link href={`/properties/${propertyId}/visual/rooms`} className="rounded-md bg-black/40 px-3 py-1.5">
          &larr; Areas
        </Link>
      </div>

      {!photo ? (
        <div className="mx-auto max-w-md px-6 py-16 text-center text-white">
          <p className="text-lg font-medium">No photos of {space.name} yet</p>
          <p className="mt-1 text-sm text-white/60">
            Add a photo to start placing hotspots on walls, fixtures, and appliances.
          </p>
          <form action={uploadAction} className="mt-6 flex flex-col items-center gap-2">
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              required
              className="text-sm text-white/80"
            />
            <button
              type="submit"
              disabled={uploadPending}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
            >
              {uploadPending ? "Uploading..." : "Add photo"}
            </button>
          </form>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={stageRef}
            className={`relative mx-auto ${isPlacing ? "cursor-crosshair outline-none focus-visible:ring-4 focus-visible:ring-amber-400/60" : ""}`}
            style={{ aspectRatio: photo.width && photo.height ? `${photo.width} / ${photo.height}` : "16 / 9" }}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onKeyDown={handleStageKeyDown}
            tabIndex={isPlacing ? 0 : undefined}
            role={isPlacing ? "application" : undefined}
            aria-label={
              isPlacing
                ? "Photo of " +
                  space.name +
                  ". Press Enter to place a hotspot, arrow keys to move it, Shift plus arrow keys to resize it, Escape to cancel."
                : undefined
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- see docs/decisions/0006 */}
            <img src={photo.url} alt={`${space.name} photo`} className="h-full w-full select-none object-contain" draggable={false} />

            {photo.annotations.map((annotation) => (
              <button
                key={annotation.id}
                type="button"
                style={renderHotspotStyle(annotation.coordinates)}
                className={`group absolute border-2 transition-colors ${
                  selectedAnnotationId === annotation.id
                    ? "border-amber-400 bg-amber-400/20"
                    : "border-transparent bg-amber-300/0 hover:border-amber-300/80 hover:bg-amber-300/15"
                }`}
                onClick={() => setSelectedAnnotationId(annotation.id)}
              >
                <span className="pointer-events-none absolute -top-7 left-0 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                  {annotation.label}
                </span>
              </button>
            ))}

            {draft && (
              <div
                style={renderHotspotStyle(
                  draft.type === "point"
                    ? { x: draft.x, y: draft.y }
                    : { x: draft.x, y: draft.y, w: draft.w, h: draft.h },
                )}
                className="pointer-events-none absolute border-2 border-dashed border-white bg-white/10"
              />
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex justify-center gap-2 bg-black/60 p-3">
              {photos.map((p, index) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setActiveIndex(index);
                    setSelectedAnnotationId(null);
                  }}
                  className={`h-12 w-16 overflow-hidden rounded border-2 ${
                    index === activeIndex ? "border-white" : "border-transparent opacity-70"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 bg-black/60 p-3 text-sm text-white/80">
            <div className="flex flex-wrap gap-2">
              {isPlacing ? (
                <>
                  <span className="rounded-md bg-white/10 px-3 py-1.5">
                    Click, or drag a box, on the photo -- or press Enter on it to place one, arrow keys to move it
                  </span>
                  <button type="button" onClick={cancelPlacing} className="rounded-md bg-white/10 px-3 py-1.5">
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsPlacing(true);
                    // Send keyboard users straight to the one control that
                    // now does something (the photo itself) instead of
                    // leaving focus on a button that just disappeared.
                    requestAnimationFrame(() => stageRef.current?.focus());
                  }}
                  className="rounded-md bg-white px-3 py-1.5 font-medium text-zinc-900"
                >
                  + Add hotspot
                </button>
              )}
              {!photo.isCover && (
                <button
                  type="button"
                  onClick={() => startTransition(() => setCoverPhoto(space.id, photo.id, redirectPath))}
                  className="rounded-md bg-white/10 px-3 py-1.5"
                >
                  Set as cover
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this photo? Its hotspots will be removed too.")) {
                    startTransition(() => deleteAttachment(photo.id, photo.storagePath, redirectPath));
                    setActiveIndex(0);
                  }
                }}
                className="rounded-md bg-white/10 px-3 py-1.5"
              >
                Delete photo
              </button>
            </div>
            <form action={uploadAction} className="flex items-center gap-2">
              <input
                type="file"
                name="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                required
                className="max-w-[10rem] text-xs text-white/70"
              />
              <button
                type="submit"
                disabled={uploadPending}
                className="rounded-md bg-white/10 px-3 py-1.5 disabled:opacity-50"
              >
                {uploadPending ? "..." : "Add another photo"}
              </button>
            </form>
          </div>
        </div>
      )}

      {draft && (
        <form
          action={saveHotspot}
          className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-end gap-3 border-t border-zinc-800 bg-zinc-900 p-4 text-sm text-white sm:inset-x-auto sm:right-6 sm:bottom-6 sm:rounded-md sm:border"
        >
          <div className="flex-1 sm:w-56 sm:flex-none">
            <label className="block text-xs text-white/60">What is this?</label>
            <input
              name="label"
              required
              placeholder="e.g. North Wall"
              className="mt-1 w-full rounded-md border border-white/20 bg-white/5 px-2 py-1.5 text-white"
            />
          </div>
          <div className="flex-1 sm:w-56 sm:flex-none">
            <label className="block text-xs text-white/60">Link to asset (optional)</label>
            <select name="assetId" defaultValue="" className="mt-1 w-full rounded-md border border-white/20 bg-white/5 px-2 py-1.5 text-white">
              <option value="">Not linked yet</option>
              {assets
                .filter((asset) => !asset.space_id || asset.space_id === space.id)
                .map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
            </select>
          </div>
          <button type="submit" disabled={creating} className="rounded-md bg-white px-4 py-2 font-medium text-zinc-900 disabled:opacity-50">
            {creating ? "Saving..." : "Save hotspot"}
          </button>
          <button type="button" onClick={cancelPlacing} className="rounded-md bg-white/10 px-4 py-2">
            Cancel
          </button>
        </form>
      )}

      {/* Desktop: right-side drawer. Mobile: bottom sheet -- see Section 23 of
          the visual-mode spec. Both axes' translate utilities compose into one
          transform, so the closed state can slide down on mobile and slide
          right on desktop from the same className. */}
      <aside
        className={`fixed inset-x-0 bottom-0 z-20 flex max-h-[80vh] w-full transform flex-col overflow-y-auto rounded-t-xl bg-white shadow-xl transition-transform dark:bg-zinc-900 sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-full sm:max-w-sm sm:rounded-none ${
          selected ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        }`}
      >
        {selected && (
          <AnnotationDrawer
            annotation={selected}
            assets={assets}
            propertyId={propertyId}
            spaceId={space.id}
            redirectPath={redirectPath}
            onClose={() => setSelectedAnnotationId(null)}
          />
        )}
      </aside>
    </div>
  );
}

function AnnotationDrawer({
  annotation,
  assets,
  propertyId,
  spaceId,
  redirectPath,
  onClose,
}: {
  annotation: { id: string; label: string; asset: StageAsset | null };
  assets: { id: string; name: string; space_id: string | null }[];
  propertyId: string;
  spaceId: string;
  redirectPath: string;
  onClose: () => void;
}) {
  const [, startTransition] = useTransition();
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div>
          {annotation.asset?.category && (
            <p className="text-xs uppercase tracking-wide text-zinc-500">{annotation.asset.category}</p>
          )}
          <h2 className="mt-1 text-xl font-semibold">{annotation.label}</h2>
        </div>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {!annotation.asset ? (
          <div className="text-sm text-zinc-500">
            <p>This hotspot isn&apos;t linked to an asset yet.</p>
            {linking ? (
              <form
                action={async (formData: FormData) => {
                  const assetId = String(formData.get("assetId") ?? "");
                  if (!assetId) return;
                  await linkAnnotationAsset(annotation.id, assetId, redirectPath);
                  setLinking(false);
                }}
                className="mt-3 flex flex-col gap-2"
              >
                <select
                  name="assetId"
                  required
                  defaultValue=""
                  className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="" disabled>
                    Choose an asset
                  </option>
                  {assets
                    .filter((asset) => !asset.space_id || asset.space_id === spaceId)
                    .map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
                    Link
                  </button>
                  <button type="button" onClick={() => setLinking(false)} className="text-sm underline">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => setLinking(true)} className="mt-2 underline">
                Link an existing asset
              </button>
            )}
            <p className="mt-3 text-xs">
              No asset yet? <Link href={`/properties/${propertyId}/assets/new`} className="underline">Add one in Property Records</Link>, then come back to link it.
            </p>
          </div>
        ) : (
          <>
            {annotation.asset.fields.length > 0 && (
              <dl className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                {annotation.asset.fields.map((field) => (
                  <div key={field.label} className="flex justify-between gap-4 py-2">
                    <dt className="text-zinc-500">{field.label}</dt>
                    <dd className="text-right font-medium">{field.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {annotation.asset.attachments.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Attachments</h3>
                <ul className="mt-2 space-y-1">
                  {annotation.asset.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <button
                        type="button"
                        onClick={() => setShowReceipt(showReceipt === attachment.id ? null : attachment.id)}
                        className="text-sm underline"
                      >
                        {attachment.name}
                      </button>
                      {showReceipt === attachment.id && attachment.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attachment.url} alt={attachment.name} className="mt-2 max-h-64 rounded-md border border-zinc-200 dark:border-zinc-800" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {annotation.asset.history.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">History</h3>
                <ul className="mt-2 space-y-2">
                  {annotation.asset.history.map((entry) => (
                    <li key={entry.id} className="text-sm">
                      <span className="text-zinc-500">{entry.date}</span> &mdash; {entry.type}
                      {entry.note && <span className="text-zinc-500"> ({entry.note})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link href={`/assets/${annotation.asset.id}`} className="mt-6 inline-block text-sm underline">
              Open full asset record
            </Link>
          </>
        )}
      </div>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => {
            if (confirm("Remove this hotspot? The asset itself won't be deleted.")) {
              startTransition(() => deleteAnnotation(annotation.id, redirectPath));
              onClose();
            }
          }}
          className="text-xs text-red-600 underline"
        >
          Remove hotspot
        </button>
      </div>
    </div>
  );
}

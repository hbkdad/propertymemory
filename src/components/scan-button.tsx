"use client";

import { useRef, useState } from "react";
import type { ExtractionResult } from "@/lib/actions/extraction";

// Phone camera photos are routinely 3-8MB at 4000px+ -- far more detail than
// OCR needs. Downscaling client-side before upload cuts upload time and
// server-side OCR time, and makes it much less likely a legitimate photo
// trips the 10MB server-side cap. Never blocks the scan on failure: this is
// a pure optimization, so any error just falls back to the original file.
async function downscaleForUpload(file: File, maxDimension = 1600): Promise<File> {
  if (typeof createImageBitmap === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function ScanButton<T>({
  label,
  action,
  onResult,
}: {
  label: string;
  action: (formData: FormData) => Promise<ExtractionResult<T>>;
  onResult: (data: T) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPending(true);
    setError(null);
    setScanned(false);
    const resized = await downscaleForUpload(file);
    const formData = new FormData();
    formData.set("file", resized);
    const result = await action(formData);
    setPending(false);

    if (result.ok) {
      onResult(result.data);
      setScanned(true);
    } else {
      setError(result.message);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="rounded-md border border-dashed border-zinc-400 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-600"
      >
        {pending ? "Reading photo..." : label}
      </button>
      {scanned && !error && (
        <p className="mt-1 text-xs text-zinc-500">Filled in below -- review before saving.</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

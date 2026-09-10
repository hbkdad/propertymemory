"use client";

import { useRef, useState } from "react";
import type { ExtractionResult } from "@/lib/actions/extraction";
import { downscaleForUpload } from "@/lib/image";

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
    const { file: resized } = await downscaleForUpload(file, 1600);
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

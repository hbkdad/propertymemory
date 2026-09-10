// Phone camera photos are routinely 3-8MB at 4000px+ -- far more detail than
// OCR or on-screen display needs. Downscaling client-side before upload cuts
// upload time and makes it much less likely a legitimate photo trips a
// server-side size cap. Never blocks the caller on failure: this is a pure
// optimization, so any error just falls back to the original file (with no
// known dimensions -- callers treat that as "unknown, don't reserve space").
//
// No separate thumbnail variant: Supabase Storage's image-transform API is
// Pro-plan only (unavailable on this project's free tier), so there's one
// downscaled size per photo, chosen per use case via maxDimension.
export async function downscaleForUpload(
  file: File,
  maxDimension: number,
): Promise<{ file: File; width: number | null; height: number | null }> {
  if (typeof createImageBitmap === "undefined") return { file, width: null, height: null };
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    if (scale === 1) {
      bitmap.close();
      return { file, width, height };
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return { file, width: bitmap.width, height: bitmap.height };
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return { file, width, height };
    return {
      file: new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }),
      width,
      height,
    };
  } catch {
    return { file, width: null, height: null };
  }
}

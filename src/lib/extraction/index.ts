import "server-only";
import { tesseractProvider } from "./tesseract-provider";
import type { ExtractionProvider } from "./types";

export type { ApplianceLabelExtraction, ExtractionProvider, ReceiptExtraction } from "./types";

// Free/local baseline (ADR 0004). A paid, vision-capable provider can be
// added later behind this same interface, selected by config -- never a
// hard dependency for the app to function.
export function getExtractionProvider(): ExtractionProvider {
  return tesseractProvider;
}

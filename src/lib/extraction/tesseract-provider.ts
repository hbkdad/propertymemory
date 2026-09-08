import "server-only";
import os from "node:os";
import { createWorker } from "tesseract.js";
import { parseApplianceLabelText, parseReceiptText } from "./parse";
import type { ApplianceLabelExtraction, ExtractionProvider, ReceiptExtraction } from "./types";

async function recognize(image: Buffer): Promise<{ text: string; confidence: number }> {
  // cachePath: on Vercel only /tmp is writable, so the downloaded language
  // model is cached there (and reused across warm invocations of the same
  // instance) instead of the default cwd, which is read-only in production.
  const worker = await createWorker("eng", undefined, { cachePath: os.tmpdir() });
  try {
    const { data } = await worker.recognize(image);
    return { text: data.text, confidence: data.confidence };
  } finally {
    await worker.terminate();
  }
}

export const tesseractProvider: ExtractionProvider = {
  name: "tesseract",

  async extractReceipt(image: Buffer): Promise<ReceiptExtraction> {
    const { text, confidence } = await recognize(image);
    return { ...parseReceiptText(text), confidence, rawText: text };
  },

  async extractApplianceLabel(image: Buffer): Promise<ApplianceLabelExtraction> {
    const { text, confidence } = await recognize(image);
    return { ...parseApplianceLabelText(text), confidence, rawText: text };
  },
};

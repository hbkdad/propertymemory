export type ReceiptExtraction = {
  vendor: string | null;
  date: string | null;
  total: number | null;
  confidence: number;
  rawText: string;
};

export type ApplianceLabelExtraction = {
  manufacturer: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  confidence: number;
  rawText: string;
};

export interface ExtractionProvider {
  name: string;
  extractReceipt(image: Buffer): Promise<ReceiptExtraction>;
  extractApplianceLabel(image: Buffer): Promise<ApplianceLabelExtraction>;
}

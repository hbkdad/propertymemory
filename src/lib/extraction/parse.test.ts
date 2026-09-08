import { describe, expect, it } from "vitest";
import { parseApplianceLabelText, parseReceiptText } from "./parse";

describe("parseReceiptText", () => {
  it("extracts vendor, date, and the labeled total", () => {
    const text = "HOME DEPOT\n123 Main St\n03/15/2026\nSubtotal $41.23\nTax $3.30\nTotal $44.53";
    expect(parseReceiptText(text)).toEqual({
      vendor: "HOME DEPOT",
      date: "2026-03-15",
      total: 44.53,
    });
  });

  it("falls back to the largest dollar amount when no line says total", () => {
    const text = "Corner Hardware\n2026-09-01\nWidget $12.00\nGadget $89.99";
    expect(parseReceiptText(text).total).toBe(89.99);
  });

  it("does not mistake a subtotal line for the total", () => {
    const text = "Store\nSub Total: $10.00\nTotal: $10.80";
    expect(parseReceiptText(text).total).toBe(10.8);
  });

  it("returns nulls when nothing recognizable is present", () => {
    expect(parseReceiptText("")).toEqual({ vendor: null, date: null, total: null });
  });
});

describe("parseApplianceLabelText", () => {
  it("extracts manufacturer, model, and serial from a label", () => {
    const text = "LENNOX HVAC SYSTEMS\nMODEL NO: EL296V\nSERIAL NO: SN-98765\nMFG DATE: 2024-03";
    expect(parseApplianceLabelText(text)).toEqual({
      manufacturer: "LENNOX HVAC SYSTEMS",
      modelNumber: "EL296V",
      serialNumber: "SN-98765",
    });
  });

  it("recognizes the S/N abbreviation", () => {
    const text = "Whirlpool\nModel# WRF555SDFZ\nS/N: K12345678";
    expect(parseApplianceLabelText(text)).toEqual({
      manufacturer: "Whirlpool",
      modelNumber: "WRF555SDFZ",
      serialNumber: "K12345678",
    });
  });

  it("does not pick a model/serial line as the manufacturer guess", () => {
    const text = "MODEL NO: EL296V\nLennox\nSERIAL NO: SN-98765";
    expect(parseApplianceLabelText(text).manufacturer).toBe("Lennox");
  });

  it("returns nulls when nothing recognizable is present", () => {
    expect(parseApplianceLabelText("")).toEqual({
      manufacturer: null,
      modelNumber: null,
      serialNumber: null,
    });
  });
});

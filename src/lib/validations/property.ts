import { z } from "zod";

export const propertyTypes = ["single_family", "condo", "multi_unit", "commercial", "other"] as const;

export const propertyTypeLabels: Record<(typeof propertyTypes)[number], string> = {
  single_family: "Single-family home",
  condo: "Condo",
  multi_unit: "Multi-unit / rental",
  commercial: "Commercial",
  other: "Other",
};

export const propertySchema = z.object({
  name: z.string().trim().min(1, "Required"),
  propertyType: z.enum(propertyTypes),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  region: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

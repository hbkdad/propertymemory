import { z } from "zod";

export const propertyTypes = ["single_family", "condo", "multi_unit", "commercial", "other"] as const;

export const onboardingSchema = z.object({
  accountName: z.string().trim().min(1, "Required"),
  propertyName: z.string().trim().min(1, "Required"),
  propertyType: z.enum(propertyTypes),
  addressLine1: z.string().trim().optional(),
  city: z.string().trim().optional(),
});

import { z } from "zod";

export const assetSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  assetCategoryId: z.string().trim().optional(),
  spaceId: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  modelNumber: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  installedOn: z.string().trim().optional(),
  purchasedOn: z.string().trim().optional(),
  purchasePrice: z.coerce.number().positive().optional(),
  vendorId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

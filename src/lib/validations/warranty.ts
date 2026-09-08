import { z } from "zod";

export const warrantySchema = z.object({
  provider: z.string().trim().min(1, "Required"),
  policyNumber: z.string().trim().optional(),
  claimReference: z.string().trim().optional(),
  startsOn: z.string().trim().optional(),
  expiresOn: z.string().trim().min(1, "Required"),
  notes: z.string().trim().optional(),
});

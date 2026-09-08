import { z } from "zod";

export const spaceSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  spaceType: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

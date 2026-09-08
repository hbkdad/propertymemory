import { z } from "zod";

export const recordSchema = z.object({
  recordTypeId: z.string().trim().min(1, "Required"),
  title: z.string().trim().min(1, "Required"),
  description: z.string().trim().optional(),
  occurredOn: z.string().trim().min(1, "Required"),
  cost: z.string().trim().optional(),
  // "space:<id>" | "asset:<id>" | "" (whole property) -- the DB only allows
  // at most one of space_id/asset_id set (records_single_scope), so the form
  // exposes one combined choice instead of two dropdowns a user could
  // contradictorily fill in both.
  scope: z.string().trim().optional(),
});

export function parseScope(scope: string | undefined) {
  if (!scope) return { spaceId: null, assetId: null };
  const [kind, id] = scope.split(":");
  if (kind === "space") return { spaceId: id, assetId: null };
  if (kind === "asset") return { spaceId: null, assetId: id };
  return { spaceId: null, assetId: null };
}

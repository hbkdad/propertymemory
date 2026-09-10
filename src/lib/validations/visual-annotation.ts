import { z } from "zod";

export const annotationTypes = ["point", "rectangle", "polygon"] as const;

// Normalized (0-1) coordinates relative to the photo's own width/height --
// see the comment on visual_annotations.coordinates in
// supabase/migrations/20260910000000_visual_property_media.sql for why.
const unit = z.number().min(0).max(1);
const pointCoordinates = z.object({ x: unit, y: unit });
const rectangleCoordinates = z.object({ x: unit, y: unit, w: unit, h: unit });
const polygonCoordinates = z.object({ points: z.array(z.tuple([unit, unit])).min(3) });

export const annotationSchema = z
  .object({
    annotationType: z.enum(annotationTypes),
    coordinates: z.unknown(),
    label: z.string().trim().min(1, "Required"),
    assetId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    const shape =
      data.annotationType === "point"
        ? pointCoordinates
        : data.annotationType === "rectangle"
          ? rectangleCoordinates
          : polygonCoordinates;
    const result = shape.safeParse(data.coordinates);
    if (!result.success) {
      ctx.addIssue({ code: "custom", path: ["coordinates"], message: "Invalid hotspot shape." });
    }
  })
  .transform((data) => ({ ...data, coordinates: data.coordinates as Record<string, unknown> }));

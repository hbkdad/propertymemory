import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { getRoomStage } from "@/lib/visual-property";
import { RoomStageViewer } from "./room-stage-viewer";

export default async function VisualRoomPage(props: PageProps<"/properties/[id]/visual/[spaceId]">) {
  await requireUser();
  const { id, spaceId } = await props.params;

  const supabase = await createClient();
  const [{ data: property }, stage, { data: assets }] = await Promise.all([
    supabase.from("properties").select("id, organization_id, name").eq("id", id).maybeSingle(),
    getRoomStage(id, spaceId),
    supabase.from("assets").select("id, name, space_id").eq("property_id", id).order("name"),
  ]);

  if (!property || !stage) {
    notFound();
  }

  return (
    <RoomStageViewer
      propertyId={property.id}
      propertyName={property.name}
      organizationId={property.organization_id}
      space={stage.space}
      photos={stage.photos}
      assets={assets ?? []}
    />
  );
}

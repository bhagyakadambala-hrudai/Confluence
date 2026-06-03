import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import SpaceEditorClient from "./SpaceEditorClient";

export default async function SpaceEditPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: space } = await admin.from("spaces").select("*").eq("id", spaceId).single();
  if (!space) notFound();

  return <SpaceEditorClient space={space} currentUserId={user.id} />;
}

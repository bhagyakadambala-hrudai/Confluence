import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import SpaceOverview from "./SpaceOverview";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createAdminClient();

  const { data: space } = await admin.from("spaces").select("*").eq("id", spaceId).single();
  if (!space) notFound();

  const { data: pages } = await admin
    .from("pages")
    .select("id, title, emoji, updated_at, author_id, profiles(full_name, avatar_url)")
    .eq("space_id", spaceId)
    .order("updated_at", { ascending: false })
    .limit(20);

  const { data: members } = await admin
    .from("space_members")
    .select("role, profiles(id, full_name, avatar_url, email)")
    .eq("space_id", spaceId);

  type SpaceOverviewProps = Parameters<typeof SpaceOverview>[0];
  return (
    <SpaceOverview
      space={space}
      pages={(pages || []) as unknown as SpaceOverviewProps["pages"]}
      members={(members || []) as unknown as SpaceOverviewProps["members"]}
      currentUserId={user.id}
    />
  );
}

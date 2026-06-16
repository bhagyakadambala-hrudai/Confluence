import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function NewPagePage({
  searchParams,
}: {
  searchParams: Promise<{ space_id?: string; parent_id?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { space_id: requestedSpaceId, parent_id: requestedParentId } = await searchParams;

  let spaceId: string | null = null;

  // If a specific space was passed (e.g. user was inside that space), verify membership and use it
  if (requestedSpaceId) {
    const { data: membership } = await admin
      .from("space_members")
      .select("space_id")
      .eq("space_id", requestedSpaceId)
      .eq("user_id", user.id)
      .single();
    if (membership) spaceId = requestedSpaceId;
  }

  // Fallback: first space the user is a member of
  if (!spaceId) {
    const { data: memberships } = await admin
      .from("space_members")
      .select("space_id")
      .eq("user_id", user.id)
      .order("created_at")
      .limit(1);
    spaceId = memberships?.[0]?.space_id ?? null;
  }

  // Fallback: spaces owned by user
  if (!spaceId) {
    const { data: owned } = await admin
      .from("spaces")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at")
      .limit(1);
    spaceId = owned?.[0]?.id ?? null;
  }

  // No spaces — auto-create a personal space
  if (!spaceId) {
    const { data: newSpace } = await admin
      .from("spaces")
      .insert({ name: "My Space", description: "Personal workspace", emoji: "🏠", owner_id: user.id })
      .select("id")
      .single();

    if (!newSpace) redirect("/");

    await admin.from("space_members").insert({ space_id: newSpace.id, user_id: user.id, role: "owner" });
    spaceId = newSpace.id;
  }

  // Create a blank page and redirect to editor
  const { data: page } = await admin
    .from("pages")
    .insert({
      space_id: spaceId,
      parent_id: requestedParentId || null,
      title: "",
      content: "",
      emoji: "📄",
      author_id: user.id,
      labels: [],
      position: 0,
    })
    .select("id, space_id")
    .single();

  if (!page) redirect("/");

  redirect(`/spaces/${page.space_id}/pages/${page.id}/edit`);
}

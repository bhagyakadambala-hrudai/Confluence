import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function NewPagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Two-step: get space IDs this user is a member of
  const { data: memberships } = await admin
    .from("space_members")
    .select("space_id")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1);

  let spaceId: string | null = null;

  if (memberships && memberships.length > 0) {
    spaceId = memberships[0].space_id;
  } else {
    // Fallback: spaces owned by user
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
    .insert({ space_id: spaceId, title: "", content: "", emoji: "📄", author_id: user.id, labels: [], position: 0 })
    .select("id, space_id")
    .single();

  if (!page) redirect("/");

  redirect(`/spaces/${page.space_id}/pages/${page.id}/edit`);
}

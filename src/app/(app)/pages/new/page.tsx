import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export default async function NewPagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Get the user's first space
  let { data: spaces } = await admin
    .from("spaces")
    .select("id")
    .or(`owner_id.eq.${user.id},id.in.(select space_id from space_members where user_id='${user.id}')`)
    .order("created_at")
    .limit(1);

  // Fallback: spaces owned by user
  if (!spaces || spaces.length === 0) {
    const { data: owned } = await admin
      .from("spaces")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at")
      .limit(1);
    spaces = owned;
  }

  // No spaces at all — auto-create a personal space so the editor opens directly
  let spaceId: string;
  if (!spaces || spaces.length === 0) {
    const { data: newSpace } = await admin
      .from("spaces")
      .insert({
        name: "My Space",
        description: "Personal workspace",
        emoji: "🏠",
        owner_id: user.id,
      })
      .select("id")
      .single();

    if (!newSpace) redirect("/");

    await admin.from("space_members").insert({
      space_id: newSpace.id,
      user_id: user.id,
      role: "owner",
    });

    spaceId = newSpace.id;
  } else {
    spaceId = spaces[0].id;
  }

  // Create a blank page and open the editor
  const { data: page } = await admin
    .from("pages")
    .insert({
      space_id: spaceId,
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

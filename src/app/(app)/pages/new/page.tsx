import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewPagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id")
    .order("created_at")
    .limit(1);

  if (!spaces || spaces.length === 0) redirect("/");

  const { data: page } = await supabase
    .from("pages")
    .insert({
      space_id: spaces[0].id,
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

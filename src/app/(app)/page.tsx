import { createClient } from "@/lib/supabase/server";
import HomeContent from "@/components/home/HomeContent";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: recentPages } = await supabase
    .from("pages")
    .select("id, title, emoji, space_id, updated_at, spaces(name, emoji)")
    .order("updated_at", { ascending: false })
    .limit(10);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  const pages = (recentPages || []).map((p) => ({
    ...p,
    spaces: (p.spaces as unknown) as { name: string; emoji: string } | null,
  }));

  return <HomeContent recentPages={pages} firstName={firstName} />;
}

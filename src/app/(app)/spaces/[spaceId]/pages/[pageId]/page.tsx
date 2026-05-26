import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PageView from "@/components/pages/PageView";

export default async function PageViewRoute({
  params,
}: {
  params: Promise<{ spaceId: string; pageId: string }>;
}) {
  const { spaceId, pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createAdminClient();

  const { data: page } = await admin
    .from("pages")
    .select("*, profiles(id, full_name, avatar_url)")
    .eq("id", pageId)
    .single();

  if (!page) notFound();

  const { data: space } = await admin
    .from("spaces")
    .select("id, name, emoji")
    .eq("id", spaceId)
    .single();

  const parentPageResult = page.parent_id
    ? await admin
        .from("pages")
        .select("id, title, emoji")
        .eq("id", page.parent_id)
        .single()
    : { data: null };

  const { data: labels } = await admin
    .from("labels")
    .select("*")
    .eq("space_id", spaceId);

  return (
    <PageView
      page={page}
      space={space}
      parentPage={parentPageResult.data}
      labels={labels || []}
      currentUserId={user.id}
    />
  );
}

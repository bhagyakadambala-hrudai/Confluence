import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageEditor from "@/components/pages/PageEditor";

export default async function PageEditView({
  params,
}: {
  params: Promise<{ spaceId: string; pageId: string }>;
}) {
  const { spaceId, pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: page } = await supabase
    .from("pages")
    .select("*, profiles(id, full_name, avatar_url)")
    .eq("id", pageId)
    .single();

  if (!page) notFound();

  const { data: space } = await supabase
    .from("spaces")
    .select("id, name, emoji")
    .eq("id", spaceId)
    .single();

  const { data: parentPage } = page.parent_id
    ? await supabase
        .from("pages")
        .select("id, title, emoji")
        .eq("id", page.parent_id)
        .single()
    : { data: null };

  const { data: labels } = await supabase
    .from("labels")
    .select("*")
    .eq("space_id", spaceId);

  return (
    <PageEditor
      page={page}
      space={space}
      parentPage={parentPage}
      labels={labels || []}
      currentUserId={user!.id}
    />
  );
}

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PageEditor from "@/components/pages/PageEditor";

export default async function PageEditView({
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
    .select("*")
    .eq("id", pageId)
    .single();

  if (!page) notFound();

  const [
    { data: space },
    { data: profile },
    { data: labels },
  ] = await Promise.all([
    admin.from("spaces").select("id, name, emoji").eq("id", spaceId).single(),
    admin.from("profiles").select("id, full_name, avatar_url").eq("id", page.author_id).single(),
    admin.from("labels").select("*").eq("space_id", spaceId),
  ]);

  const parentPageResult = page.parent_id
    ? await admin.from("pages").select("id, title, emoji").eq("id", page.parent_id).single()
    : { data: null };

  return (
    <PageEditor
      page={{ ...page, profiles: profile }}
      space={space}
      parentPage={parentPageResult.data}
      labels={labels || []}
      currentUserId={user.id}
    />
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CreatePageButton from "@/components/pages/CreatePageButton";
import InviteMemberButton from "@/components/spaces/InviteMemberButton";
import SpaceTabs from "./SpaceTabs";
import Link from "next/link";
import { Settings } from "lucide-react";

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
    .limit(50);

  const { data: members } = await admin
    .from("space_members")
    .select("role, profiles(id, full_name, avatar_url, email)")
    .eq("space_id", spaceId);

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-[#1B2A3B]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1B2A3B] border-b border-[#DFE1E6] dark:border-slate-700 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl leading-none">{space.emoji || "📁"}</span>
            <div>
              <h1 className="text-3xl font-bold text-[#172B4D] dark:text-white">{space.name}</h1>
              {space.description && (
                <p className="text-[#6B778C] dark:text-slate-400 mt-1 text-sm">{space.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CreatePageButton spaceId={spaceId} />
            {user?.id === space.owner_id && <InviteMemberButton spaceId={spaceId} />}
            <Link
              href={`/spaces/${spaceId}/settings`}
              className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      <SpaceTabs
        space={space}
        pages={(pages || []) as unknown as Parameters<typeof SpaceTabs>[0]["pages"]}
        members={(members || []) as unknown as Parameters<typeof SpaceTabs>[0]["members"]}
        currentUserId={user.id}
      />
    </div>
  );
}

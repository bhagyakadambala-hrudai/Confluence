import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import InviteMemberButton from "@/components/spaces/InviteMemberButton";
import CreatePageButton from "@/components/pages/CreatePageButton";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { FileText, Settings, Users, Star } from "lucide-react";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: space } = await supabase
    .from("spaces")
    .select("*")
    .eq("id", spaceId)
    .single();

  if (!space) notFound();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, emoji, updated_at, author_id, profiles(full_name, avatar_url)")
    .eq("space_id", spaceId)
    .order("updated_at", { ascending: false })
    .limit(20);

  const { data: members } = await supabase
    .from("space_members")
    .select("role, profiles(id, full_name, avatar_url, email)")
    .eq("space_id", spaceId);

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-[#1B2A3B]">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-[#1B2A3B] border-b border-[#DFE1E6] dark:border-slate-700 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl leading-none">{space.emoji || "📁"}</span>
            <div>
              <h1 className="text-3xl font-bold text-[#172B4D] dark:text-white">
                {space.name}
              </h1>
              {space.description && (
                <p className="text-[#6B778C] dark:text-slate-400 mt-1 text-sm">
                  {space.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CreatePageButton spaceId={spaceId} />
            {user?.id === space.owner_id && (
              <InviteMemberButton spaceId={spaceId} />
            )}
            <Link
              href={`/spaces/${spaceId}/settings`}
              className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
            <button className="h-8 w-8 flex items-center justify-center text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors">
              <Star className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#1B2A3B] border-b border-[#DFE1E6] dark:border-slate-700 px-8">
        <div className="max-w-5xl mx-auto flex items-center gap-0">
          {["Overview", "Pages", "Blog", "Members"].map((tab) => (
            <div
              key={tab}
              className={
                tab === "Pages"
                  ? "px-4 py-3 text-sm font-medium border-b-2 border-[#0052CC] text-[#0052CC] cursor-default"
                  : "px-4 py-3 text-sm text-[#42526E] dark:text-slate-400 hover:text-[#172B4D] dark:hover:text-white cursor-pointer transition-colors"
              }
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 py-6">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid grid-cols-3 gap-8">
            {/* Left: Pages list (2/3 width) */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#172B4D] dark:text-white text-lg">
                  Pages
                </h2>
                <CreatePageButton spaceId={spaceId} />
              </div>

              {!pages || pages.length === 0 ? (
                <div className="border border-dashed border-[#DFE1E6] dark:border-slate-600 rounded-xl p-10 text-center">
                  <FileText className="h-10 w-10 text-[#C1C7D0] dark:text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-[#172B4D] dark:text-slate-300 mb-1">
                    No pages yet
                  </p>
                  <p className="text-xs text-[#6B778C] dark:text-slate-400 mb-4">
                    Create the first page in this space
                  </p>
                  <CreatePageButton spaceId={spaceId} />
                </div>
              ) : (
                <div className="space-y-0.5">
                  {pages.map((page) => {
                    const profile = (page.profiles as unknown) as {
                      full_name: string;
                      avatar_url: string;
                    } | null;
                    return (
                      <Link
                        key={page.id}
                        href={`/spaces/${spaceId}/pages/${page.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700/50 transition-colors group"
                      >
                        <span className="text-lg leading-none shrink-0">
                          {page.emoji || "📄"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                            {page.title || "Untitled"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs text-[#97A0AF] dark:text-slate-500">
                          <span>Updated {formatRelativeTime(page.updated_at)}</span>
                          {profile && (
                            <>
                              <span>by</span>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px] bg-[#0052CC] text-white">
                                  {getInitials(profile.full_name || "U")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="max-w-[100px] truncate">
                                {profile.full_name}
                              </span>
                            </>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Members (1/3 width) */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-[#6B778C]" />
                <h2 className="font-semibold text-[#172B4D] dark:text-white">
                  Space members{" "}
                  <span className="text-[#6B778C] font-normal text-sm">
                    ({members?.length || 0})
                  </span>
                </h2>
              </div>
              <div className="space-y-3">
                {members?.map((m) => {
                  const profile = (m.profiles as unknown) as {
                    id: string;
                    full_name: string;
                    avatar_url: string;
                    email: string;
                  } | null;
                  if (!profile) return null;
                  return (
                    <div key={profile.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-xs bg-[#0052CC] text-white font-bold">
                          {getInitials(profile.full_name || profile.email || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate">
                          {profile.full_name || profile.email}
                        </p>
                        <p className="text-xs text-[#6B778C] dark:text-slate-400 truncate">
                          {profile.email}
                        </p>
                      </div>
                      <Badge
                        variant={m.role === "owner" ? "default" : "secondary"}
                        className="text-xs capitalize shrink-0"
                      >
                        {m.role}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

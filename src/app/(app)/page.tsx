import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SpaceCard from "@/components/spaces/SpaceCard";
import EmptyState from "@/components/common/EmptyState";
import CreateSpaceButton from "@/components/spaces/CreateSpaceButton";
import { BookOpen, Clock, Star } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, name, emoji, description, created_at, owner_id")
    .order("created_at", { ascending: false });

  const { data: recentPages } = await supabase
    .from("pages")
    .select("id, title, emoji, space_id, updated_at, spaces(name, emoji)")
    .order("updated_at", { ascending: false })
    .limit(8);

  const fullName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-full bg-white dark:bg-[#1B2A3B]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#DEEBFF] to-white dark:from-blue-950 dark:to-[#1B2A3B] px-8 py-12 border-b border-[#DFE1E6] dark:border-slate-700">
        <h1 className="text-3xl font-bold text-[#172B4D] dark:text-white mb-1">
          Welcome home, {fullName}!
        </h1>
        <p className="text-[#6B778C] dark:text-slate-400">
          Your team's knowledge base
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-10">

        {/* Recent activity */}
        {recentPages && recentPages.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#6B778C]" />
              <h2 className="font-semibold text-[#172B4D] dark:text-white">Recently updated</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentPages.map((page) => {
                const space = (page.spaces as unknown) as { name: string; emoji: string } | null;
                return (
                  <Link
                    key={page.id}
                    href={`/spaces/${page.space_id}/pages/${page.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[#DFE1E6] dark:border-slate-700 hover:border-[#0052CC] hover:shadow-sm dark:hover:border-blue-500 transition-all group bg-white dark:bg-slate-800"
                  >
                    <span className="text-xl leading-none mt-0.5">{page.emoji || "📄"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                        {page.title || "Untitled"}
                      </p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-500 mt-0.5 truncate">
                        {space?.emoji} {space?.name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Spaces */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#6B778C]" />
              <h2 className="font-semibold text-[#172B4D] dark:text-white">Your spaces</h2>
            </div>
            <CreateSpaceButton />
          </div>

          {!spaces || spaces.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12 text-[#6B778C]" />}
              title="No spaces yet"
              description="Create your first space to start organizing your team's knowledge."
              action={<CreateSpaceButton />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {spaces.map((space) => (
                <SpaceCard key={space.id} space={space} currentUserId={user!.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

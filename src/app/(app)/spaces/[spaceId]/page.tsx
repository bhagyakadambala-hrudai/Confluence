import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import InviteMemberButton from "@/components/spaces/InviteMemberButton";
import CreatePageButton from "@/components/pages/CreatePageButton";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { FileText, Settings, Users, Clock } from "lucide-react";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    .limit(10);

  const { data: members } = await supabase
    .from("space_members")
    .select("role, profiles(id, full_name, avatar_url, email)")
    .eq("space_id", spaceId);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{space.emoji || "📁"}</span>
          <div>
            <h1 className="text-3xl font-bold">{space.name}</h1>
            {space.description && (
              <p className="text-muted-foreground mt-1">{space.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.id === space.owner_id && (
            <InviteMemberButton spaceId={spaceId} />
          )}
          <Link href={`/spaces/${spaceId}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <CreatePageButton spaceId={spaceId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Recent pages</h2>
          </div>

          {!pages || pages.length === 0 ? (
            <div className="border border-dashed rounded-xl p-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pages yet.</p>
              <CreatePageButton spaceId={spaceId} className="mt-3" />
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/spaces/${spaceId}/pages/${page.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all group"
                >
                  <span className="text-xl">{page.emoji || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {page.title || "Untitled"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {formatRelativeTime(page.updated_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Members ({members?.length || 0})</h2>
          </div>
          <div className="space-y-3">
            {members?.map((m) => {
              const profile = (m.profiles as unknown) as { id: string; full_name: string; avatar_url: string; email: string } | null;
              if (!profile) return null;
              return (
                <div key={profile.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-xs bg-blue-500 text-white">
                      {getInitials(profile.full_name || profile.email || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile.full_name || profile.email}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                  <Badge variant={m.role === "owner" ? "default" : "secondary"} className="text-xs capitalize">
                    {m.role}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

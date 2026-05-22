import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import SpaceCard from "@/components/spaces/SpaceCard";
import EmptyState from "@/components/common/EmptyState";
import CreateSpaceButton from "@/components/spaces/CreateSpaceButton";
import { BookOpen, Plus } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, name, emoji, description, created_at, owner_id")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">
            Your spaces and knowledge base
          </p>
        </div>
        <CreateSpaceButton />
      </div>

      {!spaces || spaces.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12 text-muted-foreground" />}
          title="No spaces yet"
          description="Create your first space to start organizing your team's knowledge."
          action={<CreateSpaceButton />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} currentUserId={user!.id} />
          ))}
        </div>
      )}
    </div>
  );
}

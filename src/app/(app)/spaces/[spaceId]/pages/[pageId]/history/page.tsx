import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VersionHistory from "@/components/pages/VersionHistory";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ spaceId: string; pageId: string }>;
}) {
  const { spaceId, pageId } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id, title, emoji, space_id")
    .eq("id", pageId)
    .single();

  if (!page) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        href={`/spaces/${spaceId}/pages/${pageId}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {page.emoji} {page.title}
      </Link>
      <h1 className="text-2xl font-bold mb-6">Page History</h1>
      <VersionHistory pageId={pageId} spaceId={spaceId} />
    </div>
  );
}

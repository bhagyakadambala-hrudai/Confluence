import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_COMMENT_LENGTH = 10000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("page_id");
  if (!pageId) return NextResponse.json({ error: "page_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the caller is a member of the page's space
  const admin = createAdminClient();
  const { data: page } = await admin.from("pages").select("space_id").eq("id", pageId).single();
  if (page) {
    const { data: membership } = await admin
      .from("space_members").select("id").eq("space_id", page.space_id).eq("user_id", user.id).single();
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(id, full_name, avatar_url)")
    .eq("page_id", pageId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { page_id, content, parent_id } = await request.json();
  if (!page_id || !content?.trim()) {
    return NextResponse.json({ error: "page_id and content required" }, { status: 400 });
  }
  if (content.trim().length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: "Comment too long (max 10,000 characters)" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ page_id, content: content.trim(), parent_id: parent_id || null, author_id: user.id })
    .select("*, profiles(id, full_name, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

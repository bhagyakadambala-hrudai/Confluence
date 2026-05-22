import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("page_id");
  if (!pageId) return NextResponse.json({ error: "page_id required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { data, error } = await supabase
    .from("comments")
    .insert({ page_id, content: content.trim(), parent_id: parent_id || null, author_id: user.id })
    .select("*, profiles(id, full_name, avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

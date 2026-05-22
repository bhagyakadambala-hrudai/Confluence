import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get("space_id");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("pages")
    .select("id, title, emoji, parent_id, space_id, position, created_at, updated_at")
    .order("position", { ascending: true });

  if (spaceId) query = query.eq("space_id", spaceId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { space_id, parent_id, title, content, emoji } = body;

  if (!space_id) return NextResponse.json({ error: "space_id is required" }, { status: 400 });

  const { count } = await supabase
    .from("pages")
    .select("*", { count: "exact", head: true })
    .eq("space_id", space_id)
    .is("parent_id", parent_id || null);

  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      space_id,
      parent_id: parent_id || null,
      title: title || "Untitled",
      content: content || "",
      emoji: emoji || "📄",
      author_id: user.id,
      position: (count || 0) + 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(page, { status: 201 });
}

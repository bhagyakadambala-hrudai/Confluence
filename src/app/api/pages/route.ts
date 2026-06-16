import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get("space_id");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : null;

  // Try to include is_draft; fall back if column doesn't exist yet (migration not run)
  for (const cols of [
    "id, title, emoji, parent_id, space_id, position, is_draft, created_at, updated_at, spaces!inner(name, emoji)",
    "id, title, emoji, parent_id, space_id, position, created_at, updated_at, spaces!inner(name, emoji)",
  ]) {
    let query = admin.from("pages").select(cols).order("updated_at", { ascending: false });
    if (spaceId) query = query.eq("space_id", spaceId);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (!error) return NextResponse.json(data);
    if (!error.message.includes("is_draft")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // is_draft column missing — retry without it
  }

  return NextResponse.json([]);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { space_id, parent_id, title, content, emoji } = body;

  if (!space_id) return NextResponse.json({ error: "space_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { count } = await admin
    .from("pages")
    .select("*", { count: "exact", head: true })
    .eq("space_id", space_id)
    .is("parent_id", parent_id || null);

  const baseInsert = {
    space_id,
    parent_id: parent_id || null,
    title: title || "Untitled",
    content: content || "",
    emoji: emoji || "📄",
    author_id: user.id,
    position: (count || 0) + 1,
  };

  // Try inserting with is_draft; fall back if column doesn't exist yet
  for (const payload of [
    { ...baseInsert, is_draft: true },
    baseInsert,
  ]) {
    const { data: page, error } = await admin.from("pages").insert(payload).select().single();
    if (!error) return NextResponse.json(page, { status: 201 });
    if (!error.message.includes("is_draft")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // is_draft column missing — retry without it
  }

  return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
}

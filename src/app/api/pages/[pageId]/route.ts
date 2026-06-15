import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getCallerRole(admin: ReturnType<typeof createAdminClient>, userId: string, spaceId: string) {
  const { data } = await admin
    .from("space_members")
    .select("role")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .single();
  return data?.role ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pages")
    .select("*, profiles(id, full_name, avatar_url)")
    .eq("id", pageId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getCallerRole(admin, user.id, data.space_id);
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: page } = await admin.from("pages").select("space_id, author_id").eq("id", pageId).single();
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getCallerRole(admin, user.id, page.space_id);
  if (!role || role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.emoji !== undefined) updates.emoji = body.emoji;
  if (body.parent_id !== undefined) updates.parent_id = body.parent_id;
  if (body.labels !== undefined) updates.labels = body.labels;
  if (body.space_id !== undefined) updates.space_id = body.space_id;

  const { data, error } = await admin.from("pages").update(updates).eq("id", pageId).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: page } = await admin.from("pages").select("space_id, author_id").eq("id", pageId).single();
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getCallerRole(admin, user.id, page.space_id);
  // Only owner/admin or the page author can delete
  if (!role || role === "viewer" || (role === "editor" && page.author_id !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("pages").delete().eq("id", pageId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

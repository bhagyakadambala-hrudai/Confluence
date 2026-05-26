import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin.from("page_reactions").select("emoji, user_id").eq("page_id", pageId);

  const grouped: Record<string, { count: number; userReacted: boolean }> = {};
  for (const r of data || []) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, userReacted: false };
    grouped[r.emoji].count++;
    if (r.user_id === user.id) grouped[r.emoji].userReacted = true;
  }

  return NextResponse.json(
    Object.entries(grouped).map(([emoji, val]) => ({ emoji, ...val }))
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { emoji } = await request.json();
  if (!emoji) return NextResponse.json({ error: "emoji required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("page_reactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("page_id", pageId)
    .eq("emoji", emoji)
    .single();

  if (existing) {
    await admin.from("page_reactions").delete().eq("user_id", user.id).eq("page_id", pageId).eq("emoji", emoji);
    return NextResponse.json({ reacted: false });
  } else {
    await admin.from("page_reactions").insert({ user_id: user.id, page_id: pageId, emoji });
    return NextResponse.json({ reacted: true });
  }
}

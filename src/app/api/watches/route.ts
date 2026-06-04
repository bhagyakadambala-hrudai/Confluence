import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Get watched pages
  const { data: pageWatches } = await admin
    .from("page_watches")
    .select("page_id")
    .eq("user_id", user.id);

  // Get watched spaces (graceful fallback if table doesn't exist)
  let spaceWatches: { space_id: string }[] = [];
  try {
    const { data } = await admin
      .from("space_watches")
      .select("space_id")
      .eq("user_id", user.id);
    if (data) {
      // Fetch full space data for watched spaces
      const spaceIds = data.map((r) => r.space_id);
      if (spaceIds.length > 0) {
        const { data: spaces } = await admin
          .from("spaces")
          .select("id, name, emoji, description, owner_id, created_at")
          .in("id", spaceIds);
        return NextResponse.json({
          pages: (pageWatches || []).map((r) => r.page_id),
          spaces: spaces || [],
        });
      }
    }
  } catch {
    // space_watches table may not exist yet
  }

  return NextResponse.json({
    pages: (pageWatches || []).map((r) => r.page_id),
    spaces: [],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  // Handle space watch toggle
  if (body.space_id) {
    const { space_id } = body;
    try {
      const { data: existing } = await admin
        .from("space_watches")
        .select("id")
        .eq("user_id", user.id)
        .eq("space_id", space_id)
        .single();

      if (existing) {
        await admin.from("space_watches").delete().eq("user_id", user.id).eq("space_id", space_id);
        return NextResponse.json({ watched: false });
      } else {
        const { error } = await admin.from("space_watches").insert({ user_id: user.id, space_id });
        if (error) throw error;
        return NextResponse.json({ watched: true });
      }
    } catch {
      return NextResponse.json({ error: "space_watches table not found — run supabase-spaces-status.sql migration first" }, { status: 500 });
    }
  }

  // Handle page watch toggle
  const { page_id } = body;
  if (!page_id) return NextResponse.json({ error: "page_id or space_id required" }, { status: 400 });

  const { data: existing } = await admin
    .from("page_watches")
    .select("id")
    .eq("user_id", user.id)
    .eq("page_id", page_id)
    .single();

  if (existing) {
    await admin.from("page_watches").delete().eq("user_id", user.id).eq("page_id", page_id);
    return NextResponse.json({ watching: false });
  } else {
    await admin.from("page_watches").insert({ user_id: user.id, page_id });
    return NextResponse.json({ watching: true });
  }
}

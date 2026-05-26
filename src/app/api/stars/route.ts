import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: starredPages }, { data: starredSpaces }] = await Promise.all([
    admin.from("starred_pages").select("page_id, pages(id, title, emoji, space_id)").eq("user_id", user.id),
    admin.from("starred_spaces").select("space_id, spaces(id, name, emoji)").eq("user_id", user.id),
  ]);

  return NextResponse.json({
    pages: (starredPages || [])
      .map((r) => (r.pages as unknown) as { id: string; title: string; emoji: string; space_id: string })
      .filter(Boolean),
    spaces: (starredSpaces || [])
      .map((r) => (r.spaces as unknown) as { id: string; name: string; emoji: string })
      .filter(Boolean),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await request.json();
  if (!type || !id) return NextResponse.json({ error: "type and id required" }, { status: 400 });

  const admin = createAdminClient();
  const table = type === "page" ? "starred_pages" : "starred_spaces";
  const col = type === "page" ? "page_id" : "space_id";

  const { data: existing } = await admin
    .from(table)
    .select("id")
    .eq("user_id", user.id)
    .eq(col, id)
    .single();

  if (existing) {
    await admin.from(table).delete().eq("user_id", user.id).eq(col, id);
    return NextResponse.json({ starred: false });
  } else {
    await admin.from(table).insert({ user_id: user.id, [col]: id });
    return NextResponse.json({ starred: true });
  }
}

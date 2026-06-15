import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q")?.trim() ?? "";

  if (raw.length < 2) return NextResponse.json([]);

  // Escape special PostgREST/SQL LIKE characters to prevent filter injection
  const q = raw.replace(/[%_\\]/g, "\\$&");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Search only on title (content column contains raw HTML → noisy + slow full-table scan)
  const { data, error } = await supabase
    .from("pages")
    .select("id, title, emoji, space_id, spaces(name, emoji)")
    .ilike("title", `%${q}%`)
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

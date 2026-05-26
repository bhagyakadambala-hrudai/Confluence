import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: profile }, { data: pages }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin
      .from("pages")
      .select("id, title, emoji, space_id, updated_at, spaces(name, emoji)")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    profile,
    pages: pages || [],
    email: user.email,
    created_at: user.created_at,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, string> = {};
  if (body.full_name !== undefined) updates.full_name = body.full_name;
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

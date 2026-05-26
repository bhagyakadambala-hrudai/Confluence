import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("spaces")
    .select("*")
    .or(`owner_id.eq.${user.id},id.in.(select space_id from space_members where user_id = '${user.id}')`)
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback: return spaces owned by user
    const { data: owned } = await admin
      .from("spaces")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    return NextResponse.json(owned || []);
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, emoji } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: space, error } = await admin
    .from("spaces")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      emoji: emoji || "📁",
      owner_id: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("space_members").insert({
    space_id: space.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json(space, { status: 201 });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  const admin = createAdminClient();

  // Use inner join so stale space_members rows pointing to deleted spaces are excluded
  const { data: memberRows } = await admin
    .from("space_members")
    .select("space_id, spaces!inner(id)")
    .eq("user_id", user.id);

  const spaceIds = (memberRows || [])
    .filter((r: { spaces: unknown }) => r.spaces)
    .map((r: { space_id: string }) => r.space_id);

  if (spaceIds.length === 0) return NextResponse.json([]);

  // Query spaces by those IDs with optional status filter
  let query = admin
    .from("spaces")
    .select("*")
    .in("id", spaceIds)
    .order("created_at", { ascending: false });

  if (statusParam) {
    const { data, error } = await query.eq("status", statusParam);
    // If status column doesn't exist yet, return empty for specific-status queries
    if (error) return NextResponse.json([]);
    return NextResponse.json(data || []);
  }

  // Default: active spaces (status = 'active' OR null for legacy rows)
  const { data, error } = await query.or("status.eq.active,status.is.null");
  if (error) {
    // status column not yet added — return all spaces
    const { data: all } = await admin
      .from("spaces")
      .select("*")
      .in("id", spaceIds)
      .order("created_at", { ascending: false });
    return NextResponse.json(all || []);
  }
  return NextResponse.json(data || []);
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
      status: "active",
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

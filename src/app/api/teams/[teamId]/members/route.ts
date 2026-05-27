import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("id, role, user_id, profiles(id, full_name, avatar_url, email)")
    .eq("team_id", teamId);

  return NextResponse.json(data || []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Only team owner can add members
  const { data: team } = await admin.from("teams").select("owner_id").eq("id", teamId).single();
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (team.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role = "member" } = await request.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email.trim())
    .single();

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data, error } = await admin
    .from("team_members")
    .insert({ team_id: teamId, user_id: profile.id, role })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: team } = await admin.from("teams").select("owner_id").eq("id", teamId).single();
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (team.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await request.json();
  await admin.from("team_members").delete().eq("team_id", teamId).eq("user_id", userId);
  return NextResponse.json({ success: true });
}

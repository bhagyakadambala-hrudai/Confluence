import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupUserByEmail } from "@/lib/lookupUserByEmail";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("team_members")
    .select("id, role, user_id")
    .eq("team_id", teamId);

  if (!rows || rows.length === 0) return NextResponse.json([]);

  const userIds = rows.map((r: { user_id: string }) => r.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles || []).map((p: { id: string }) => [p.id, p]));

  const members = rows.map((r: { id: string; role: string; user_id: string }) => ({
    ...r,
    profiles: profileMap[r.user_id] ?? null,
  }));

  return NextResponse.json(members);
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

  const found = await lookupUserByEmail(admin, email);
  if (!found) {
    return NextResponse.json(
      { error: "No account found with that email. The person must sign up first." },
      { status: 404 }
    );
  }

  // Prevent duplicate
  const { data: existing } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", found.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "This person is already a member of this team." }, { status: 409 });
  }

  const { data, error } = await admin
    .from("team_members")
    .insert({ team_id: teamId, user_id: found.id, role })
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

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
  const { data: team } = await admin.from("teams").select("*").eq("id", teamId).single();
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only owner or team members may view team details
  const isOwner = team.owner_id === user.id;
  if (!isOwner) {
    const { data: membership } = await admin.from("team_members").select("id").eq("team_id", teamId).eq("user_id", user.id).single();
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch team_members rows
  const { data: memberRows } = await admin
    .from("team_members")
    .select("id, role, user_id")
    .eq("team_id", teamId);

  // Fetch profiles for all members + owner in one query
  const userIds = [
    team.owner_id,
    ...((memberRows || []).map((m: { user_id: string }) => m.user_id)),
  ].filter(Boolean);

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles || []).map((p: { id: string }) => [p.id, p]));

  const members = (memberRows || []).map((m: { id: string; role: string; user_id: string }) => ({
    ...m,
    profiles: profileMap[m.user_id] ?? null,
  }));

  const my_role = isOwner ? "owner" : ((memberRows || []).find((m: { user_id: string; role: string }) => m.user_id === user.id)?.role ?? "member");
  return NextResponse.json({ ...team, members, ownerProfile: profileMap[team.owner_id] ?? null, my_role });
}

export async function PATCH(
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

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;

  const { data, error } = await admin
    .from("teams")
    .update(updates)
    .eq("id", teamId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
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

  await admin.from("teams").delete().eq("id", teamId);
  return NextResponse.json({ success: true });
}

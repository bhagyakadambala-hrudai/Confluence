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
  const { data: page } = await admin
    .from("pages")
    .select("access_mode, inherit_permission, space_id")
    .eq("id", pageId)
    .single();
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: perms } = await admin
    .from("page_permissions")
    .select("id, can_view, can_edit, user_id, team_id, profiles(id, full_name, avatar_url, email), teams(id, name)")
    .eq("page_id", pageId);

  // Count space members for summary
  const { count: spaceMemberCount } = await admin
    .from("space_members")
    .select("id", { count: "exact", head: true })
    .eq("space_id", page.space_id);

  return NextResponse.json({
    access_mode: page.access_mode || "inherit",
    inherit_permission: page.inherit_permission || "edit",
    space_member_count: spaceMemberCount ?? 0,
    permissions: (perms || []).map((p: Record<string, unknown>) => ({
      id: p.id,
      can_view: p.can_view,
      can_edit: p.can_edit,
      user_id: p.user_id,
      team_id: p.team_id,
      profile: p.profiles,
      team: p.teams,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user_id, team_id, can_view = true, can_edit = false } = await request.json();
  if (!user_id && !team_id) {
    return NextResponse.json({ error: "user_id or team_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const insert: Record<string, unknown> = { page_id: pageId, can_view, can_edit };
  if (user_id) insert.user_id = user_id;
  if (team_id) insert.team_id = team_id;

  const { data, error } = await admin
    .from("page_permissions")
    .insert(insert)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If sharing with a team, also grant access to each individual team member
  if (team_id) {
    // Fetch team owner
    const { data: teamRow } = await admin
      .from("teams")
      .select("owner_id")
      .eq("id", team_id)
      .single();

    // Fetch all team members
    const { data: teamMembers } = await admin
      .from("team_members")
      .select("user_id")
      .eq("team_id", team_id);

    const memberIds: string[] = (teamMembers || []).map((m: { user_id: string }) => m.user_id);
    if (teamRow?.owner_id && !memberIds.includes(teamRow.owner_id)) {
      memberIds.push(teamRow.owner_id);
    }

    if (memberIds.length > 0) {
      const memberPermissions = memberIds.map((uid) => ({
        page_id: pageId,
        user_id: uid,
        can_view,
        can_edit,
      }));
      await admin
        .from("page_permissions")
        .upsert(memberPermissions, { onConflict: "page_id,user_id", ignoreDuplicates: false });
    }
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const admin = createAdminClient();
  const update: Record<string, unknown> = {};

  if (body.access_mode !== undefined) update.access_mode = body.access_mode;
  if (body.inherit_permission !== undefined) update.inherit_permission = body.inherit_permission;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("pages")
    .update(update)
    .eq("id", pageId)
    .select("id, access_mode, inherit_permission")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

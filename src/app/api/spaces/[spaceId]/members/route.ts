import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupUserByEmail } from "@/lib/lookupUserByEmail";

const VALID_ROLES = ["admin", "editor", "viewer"] as const; // "owner" cannot be assigned via API

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("space_members")
    .select("*, profiles(id, full_name, avatar_url, email)")
    .eq("space_id", spaceId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { email, team_id, role = "editor" } = body;

  if (!email && !team_id) return NextResponse.json({ error: "Email or team_id is required" }, { status: 400 });
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Only space owner/admin can add members
  const { data: myMembership } = await admin
    .from("space_members").select("role").eq("space_id", spaceId).eq("user_id", user.id).single();
  if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Handle team_id: add all team members to the space
  if (team_id) {
    const { data: teamRow } = await admin
      .from("teams")
      .select("owner_id")
      .eq("id", team_id)
      .single();

    const { data: teamMembers } = await admin
      .from("team_members")
      .select("user_id")
      .eq("team_id", team_id);

    const memberIds: string[] = (teamMembers || []).map((m: { user_id: string }) => m.user_id);
    if (teamRow?.owner_id && !memberIds.includes(teamRow.owner_id)) {
      memberIds.push(teamRow.owner_id);
    }

    if (memberIds.length === 0) {
      return NextResponse.json({ added: 0, message: "Team has no members" }, { status: 200 });
    }

    let addedCount = 0;
    for (const uid of memberIds) {
      // Skip if already a member
      const { data: existing } = await admin
        .from("space_members")
        .select("id")
        .eq("space_id", spaceId)
        .eq("user_id", uid)
        .single();
      if (existing) continue;

      const { error: insertError } = await admin
        .from("space_members")
        .insert({ space_id: spaceId, user_id: uid, role });
      if (!insertError) addedCount++;
    }

    return NextResponse.json({ added: addedCount, message: `Added ${addedCount} team member${addedCount !== 1 ? "s" : ""} to the space` }, { status: 200 });
  }

  const found = await lookupUserByEmail(admin, email);
  if (!found) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback`,
    });
    if (inviteError) {
      return NextResponse.json({ error: "Failed to send invitation: " + inviteError.message }, { status: 500 });
    }
    await admin.from("pending_invites").insert({ email, space_id: spaceId, role, invited_by: user.id });
    return NextResponse.json({ invited: true, message: `Invitation sent to ${email}` }, { status: 200 });
  }

  // Check for duplicate membership
  const { data: existing } = await admin
    .from("space_members")
    .select("id")
    .eq("space_id", spaceId)
    .eq("user_id", found.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "This person is already a member of the space." }, { status: 409 });
  }

  // Use 'editor' if the role constraint allows it, fall back to 'member' for legacy schemas
  const roleToInsert = role;
  const { data, error } = await admin
    .from("space_members")
    .insert({ space_id: spaceId, user_id: found.id, role: roleToInsert })
    .select()
    .single();

  if (error) {
    // If role constraint violation, retry with 'member' (migration not yet run)
    if (error.code === "23514" && roleToInsert !== "member") {
      const { data: d2, error: e2 } = await admin
        .from("space_members")
        .insert({ space_id: spaceId, user_id: found.id, role: "member" })
        .select()
        .single();
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      return NextResponse.json(d2, { status: 201 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, role } = await request.json();
  if (!userId || !role) return NextResponse.json({ error: "userId and role required" }, { status: 400 });
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Only space owner/admin can change roles
  const { data: myMembership } = await admin
    .from("space_members")
    .select("role")
    .eq("space_id", spaceId)
    .eq("user_id", user.id)
    .single();

  if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("space_members")
    .update({ role })
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  const { spaceId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await request.json();
  const admin = createAdminClient();

  // Only owner/admin can remove members (users can remove themselves)
  const { data: myMembership } = await admin
    .from("space_members").select("role").eq("space_id", spaceId).eq("user_id", user.id).single();
  if (!myMembership || (!["owner", "admin"].includes(myMembership.role) && user.id !== userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Prevent removing the owner
  const { data: targetMember } = await admin
    .from("space_members").select("role").eq("space_id", spaceId).eq("user_id", userId).single();
  if (targetMember?.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the space owner" }, { status: 403 });
  }

  const { error } = await admin
    .from("space_members").delete().eq("space_id", spaceId).eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

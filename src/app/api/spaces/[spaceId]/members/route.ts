import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupUserByEmail } from "@/lib/lookupUserByEmail";

const VALID_ROLES = ["owner", "admin", "editor", "viewer"] as const;

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

  const { email, role = "editor" } = await request.json();
  if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const admin = createAdminClient();

  const found = await lookupUserByEmail(admin, email);
  if (!found) {
    return NextResponse.json(
      { error: "No account found with that email. The person must sign up first." },
      { status: 404 }
    );
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
  const { error } = await admin
    .from("space_members")
    .delete()
    .eq("space_id", spaceId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

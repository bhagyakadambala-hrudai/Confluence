import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupUserByEmail } from "@/lib/lookupUserByEmail";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, spaceId, can_view = true, can_edit = false } = await request.json();
  if (!email || !spaceId) return NextResponse.json({ error: "email and spaceId are required" }, { status: 400 });
  if (!/\S+@\S+\.\S+/.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const admin = createAdminClient();

  // Only space members can share
  const { data: myMembership } = await admin
    .from("space_members").select("role").eq("space_id", spaceId).eq("user_id", user.id).single();
  if (!myMembership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const found = await lookupUserByEmail(admin, email);

  if (found) {
    // Add to space as viewer if not already a member
    await admin.from("space_members").upsert(
      { space_id: spaceId, user_id: found.id, role: "viewer" },
      { onConflict: "space_id,user_id", ignoreDuplicates: true }
    );
    // Add page permission
    const { error } = await admin.from("page_permissions").upsert(
      { page_id: pageId, user_id: found.id, can_view, can_edit },
      { onConflict: "page_id,user_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ added: true });
  }

  // User doesn't exist — send invite email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback`,
  });
  if (inviteError) {
    return NextResponse.json({ error: "Failed to send invitation: " + inviteError.message }, { status: 500 });
  }
  await admin.from("pending_invites").insert({
    email,
    space_id: spaceId,
    page_id: pageId,
    role: "viewer",
    can_view,
    can_edit,
    invited_by: user.id,
  });
  return NextResponse.json({ invited: true, message: `Invitation sent to ${email}` });
}

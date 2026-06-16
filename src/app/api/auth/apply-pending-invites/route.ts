import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ applied: 0 });

  const admin = createAdminClient();
  const { data: invites } = await admin
    .from("pending_invites")
    .select("*")
    .eq("email", user.email);

  if (!invites || invites.length === 0) return NextResponse.json({ applied: 0 });

  for (const invite of invites) {
    if (invite.space_id) {
      await admin.from("space_members").upsert(
        { space_id: invite.space_id, user_id: user.id, role: invite.role },
        { onConflict: "space_id,user_id", ignoreDuplicates: true }
      );
    }
    if (invite.page_id) {
      await admin.from("page_permissions").upsert(
        { page_id: invite.page_id, user_id: user.id, can_view: invite.can_view, can_edit: invite.can_edit },
        { onConflict: "page_id,user_id", ignoreDuplicates: true }
      );
    }
  }

  await admin.from("pending_invites").delete().eq("email", user.email);
  return NextResponse.json({ applied: invites.length });
}

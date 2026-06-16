import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    // Apply any pending invites for this user
    const { data: { user: authedUser } } = await supabase.auth.getUser();
    if (authedUser?.email) {
      const admin = createAdminClient();
      const { data: invites } = await admin
        .from("pending_invites")
        .select("*")
        .eq("email", authedUser.email);

      if (invites && invites.length > 0) {
        for (const invite of invites) {
          if (invite.space_id) {
            await admin.from("space_members").upsert(
              { space_id: invite.space_id, user_id: authedUser.id, role: invite.role },
              { onConflict: "space_id,user_id", ignoreDuplicates: true }
            );
          }
          if (invite.page_id) {
            await admin.from("page_permissions").upsert(
              { page_id: invite.page_id, user_id: authedUser.id, can_view: invite.can_view, can_edit: invite.can_edit },
              { onConflict: "page_id,user_id", ignoreDuplicates: true }
            );
          }
        }
        await admin.from("pending_invites").delete().eq("email", authedUser.email);
      }
    }
  }

  return NextResponse.redirect(`${origin}/home`);
}

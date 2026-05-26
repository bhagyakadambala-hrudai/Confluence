import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const unread_count = (data || []).filter((n) => !n.read).length;
  return NextResponse.json({ notifications: data || [], unread_count });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  if (body.all) {
    await admin.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  } else if (body.id) {
    await admin.from("notifications").update({ read: true }).eq("id", body.id).eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}

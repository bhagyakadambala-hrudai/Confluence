import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin.from("page_watches").select("page_id").eq("user_id", user.id);
  return NextResponse.json((data || []).map((r) => r.page_id));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { page_id } = await request.json();
  if (!page_id) return NextResponse.json({ error: "page_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("page_watches")
    .select("id")
    .eq("user_id", user.id)
    .eq("page_id", page_id)
    .single();

  if (existing) {
    await admin.from("page_watches").delete().eq("user_id", user.id).eq("page_id", page_id);
    return NextResponse.json({ watching: false });
  } else {
    await admin.from("page_watches").insert({ user_id: user.id, page_id });
    return NextResponse.json({ watching: true });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pageId: string; permId: string }> }
) {
  const { permId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { can_view, can_edit } = await request.json();
  const admin = createAdminClient();
  const updates: Record<string, boolean> = {};
  if (can_view !== undefined) updates.can_view = can_view;
  if (can_edit !== undefined) updates.can_edit = can_edit;

  const { data, error } = await admin
    .from("page_permissions")
    .update(updates)
    .eq("id", permId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string; permId: string }> }
) {
  const { permId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  await admin.from("page_permissions").delete().eq("id", permId);
  return NextResponse.json({ success: true });
}

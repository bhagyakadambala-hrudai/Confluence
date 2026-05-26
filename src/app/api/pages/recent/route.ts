import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Get spaces the user belongs to
  const { data: memberships } = await admin
    .from("space_members")
    .select("space_id")
    .eq("user_id", user.id);

  const { data: ownedSpaces } = await admin
    .from("spaces")
    .select("id")
    .eq("owner_id", user.id);

  const allIds = [
    ...(memberships || []).map((m) => m.space_id),
    ...(ownedSpaces || []).map((s) => s.id),
  ];
  const spaceIds = allIds.filter((id, i) => allIds.indexOf(id) === i);

  if (spaceIds.length === 0) return NextResponse.json([]);

  const { data, error } = await admin
    .from("pages")
    .select("id, title, emoji, space_id, updated_at, spaces(name)")
    .in("space_id", spaceIds)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json([], { status: 200 });

  return NextResponse.json(
    (data || []).map((p) => ({
      ...p,
      spaces: (p.spaces as unknown) as { name: string } | null,
    }))
  );
}

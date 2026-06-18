import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get("space_id");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : null;

  // Try to include is_draft + access_mode; fall back if columns don't exist yet
  let pages: Record<string, unknown>[] = [];
  let hasAccessMode = true;

  for (const cols of [
    "id, title, emoji, parent_id, space_id, position, is_draft, access_mode, created_at, updated_at, spaces!inner(name, emoji)",
    "id, title, emoji, parent_id, space_id, position, access_mode, created_at, updated_at, spaces!inner(name, emoji)",
    "id, title, emoji, parent_id, space_id, position, created_at, updated_at, spaces!inner(name, emoji)",
  ]) {
    let query = admin.from("pages").select(cols).order("updated_at", { ascending: false });
    if (spaceId) query = query.eq("space_id", spaceId);
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (!error) {
      pages = data as unknown as Record<string, unknown>[];
      if (!cols.includes("access_mode")) hasAccessMode = false;
      break;
    }
    // Retry without unsupported columns
    if (!error.message.includes("is_draft") && !error.message.includes("access_mode")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Filter restricted pages for non-privileged users (only when scoped to a space)
  if (spaceId && hasAccessMode && pages.length > 0) {
    const { data: membership } = await admin
      .from("space_members")
      .select("role")
      .eq("space_id", spaceId)
      .eq("user_id", user.id)
      .single();

    const role = membership?.role as string | undefined;
    const isPrivileged = role === "owner" || role === "admin";

    if (!isPrivileged) {
      // Get page IDs this user has explicit view access to
      const restrictedIds = pages
        .filter((p) => p.access_mode === "restricted")
        .map((p) => p.id as string);

      if (restrictedIds.length > 0) {
        // Direct user permissions
        const { data: directPerms } = await admin
          .from("page_permissions")
          .select("page_id")
          .eq("user_id", user.id)
          .eq("can_view", true)
          .in("page_id", restrictedIds);

        // Team-based permissions
        const { data: teamPerms } = await admin
          .from("page_permissions")
          .select("page_id, team_id")
          .eq("can_view", true)
          .in("page_id", restrictedIds)
          .not("team_id", "is", null);

        const teamAllowedPageIds: string[] = [];
        if (teamPerms && teamPerms.length > 0) {
          const teamIdSet = new Set(teamPerms.map((p: Record<string, unknown>) => p.team_id as string));
          const teamIds = Array.from(teamIdSet);
          const { data: userTeams } = await admin
            .from("team_members")
            .select("team_id")
            .eq("user_id", user.id)
            .in("team_id", teamIds);
          const userTeamSet = new Set((userTeams || []).map((t: Record<string, unknown>) => t.team_id as string));
          for (const p of teamPerms as Record<string, unknown>[]) {
            if (userTeamSet.has(p.team_id as string)) {
              teamAllowedPageIds.push(p.page_id as string);
            }
          }
        }

        const allowedIdArray = [
          ...(directPerms || []).map((p: Record<string, unknown>) => p.page_id as string),
          ...teamAllowedPageIds,
        ];
        const allowedIds = new Set(allowedIdArray);

        // Remove restricted pages the user can't see
        pages = pages.filter(
          (p) => p.access_mode !== "restricted" || allowedIds.has(p.id as string)
        );
      }
    }
  }

  return NextResponse.json(pages);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { space_id, parent_id, title, content, emoji } = body;

  if (!space_id) return NextResponse.json({ error: "space_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { count } = await admin
    .from("pages")
    .select("*", { count: "exact", head: true })
    .eq("space_id", space_id)
    .is("parent_id", parent_id || null);

  const baseInsert = {
    space_id,
    parent_id: parent_id || null,
    title: title ?? "",
    content: content || "",
    emoji: emoji || "📄",
    author_id: user.id,
    position: (count || 0) + 1,
  };

  // Try inserting with is_draft; fall back if column doesn't exist yet
  for (const payload of [
    { ...baseInsert, is_draft: true },
    baseInsert,
  ]) {
    const { data: page, error } = await admin.from("pages").insert(payload).select().single();
    if (!error) return NextResponse.json(page, { status: 201 });
    if (!error.message.includes("is_draft")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // is_draft column missing — retry without it
  }

  return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
}

import type { SupabaseClient } from "@supabase/supabase-js";

export interface PageAccess {
  canView: boolean;
  canEdit: boolean;
}

export async function getPageAccess(
  admin: SupabaseClient,
  pageId: string,
  userId: string,
  spaceId: string
): Promise<PageAccess> {
  // Check space membership role
  const { data: membership } = await admin
    .from("space_members")
    .select("role")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .single();

  const role = membership?.role as string | undefined;

  // Space owner and admin always have full access
  if (role === "owner" || role === "admin") {
    return { canView: true, canEdit: true };
  }

  // Fetch page access_mode
  const { data: page } = await admin
    .from("pages")
    .select("access_mode")
    .eq("id", pageId)
    .single();

  const accessMode = page?.access_mode ?? "inherit";

  if (accessMode === "inherit") {
    if (role === "editor") return { canView: true, canEdit: true };
    if (role === "viewer") return { canView: true, canEdit: false };
    return { canView: false, canEdit: false };
  }

  // access_mode === 'restricted': check page_permissions
  // Direct user match
  const { data: directPerm } = await admin
    .from("page_permissions")
    .select("can_view, can_edit")
    .eq("page_id", pageId)
    .eq("user_id", userId)
    .single();

  if (directPerm) {
    return { canView: directPerm.can_view, canEdit: directPerm.can_edit };
  }

  // Team-based match: find teams the user belongs to that have permission
  const { data: teamPerms } = await admin
    .from("page_permissions")
    .select("can_view, can_edit, team_id")
    .eq("page_id", pageId)
    .not("team_id", "is", null);

  if (teamPerms && teamPerms.length > 0) {
    const teamIds = teamPerms.map((p: { team_id: string }) => p.team_id);
    const { data: membership } = await admin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .in("team_id", teamIds);

    if (membership && membership.length > 0) {
      const userTeamIds = new Set(membership.map((m: { team_id: string }) => m.team_id));
      let canView = false;
      let canEdit = false;
      for (const perm of teamPerms) {
        if (userTeamIds.has(perm.team_id)) {
          if (perm.can_view) canView = true;
          if (perm.can_edit) canEdit = true;
        }
      }
      return { canView, canEdit };
    }
  }

  return { canView: false, canEdit: false };
}

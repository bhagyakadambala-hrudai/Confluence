import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Teams the user owns or belongs to
  const { data: ownedTeams } = await admin
    .from("teams")
    .select("*")
    .eq("owner_id", user.id);

  const { data: memberTeamRows } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const memberTeamIds = (memberTeamRows || []).map((r: { team_id: string }) => r.team_id);

  let memberTeams: unknown[] = [];
  if (memberTeamIds.length > 0) {
    const { data } = await admin
      .from("teams")
      .select("*")
      .in("id", memberTeamIds)
      .neq("owner_id", user.id);
    memberTeams = data || [];
  }

  const allTeams = [...(ownedTeams || []), ...memberTeams];

  // Attach member count and current user's role
  const teamsWithMeta = await Promise.all(
    allTeams.map(async (team: Record<string, unknown>) => {
      const { count } = await admin
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", team.id);

      const { data: myRole } = await admin
        .from("team_members")
        .select("role")
        .eq("team_id", team.id)
        .eq("user_id", user.id)
        .single();

      return {
        ...team,
        member_count: (count ?? 0) + 1, // +1 for owner
        my_role: team.owner_id === user.id ? "owner" : (myRole?.role ?? "member"),
      };
    })
  );

  return NextResponse.json(teamsWithMeta);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("teams")
    .insert({ name: name.trim(), description: description?.trim() || "", owner_id: user.id })
    .select()
    .single();

  if (error) {
    const msg = error.code === "42P01"
      ? "Teams table not found. Please run supabase-permissions.sql in your Supabase SQL Editor first."
      : error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

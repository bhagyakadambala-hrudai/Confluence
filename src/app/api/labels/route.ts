import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get("space_id");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase.from("labels").select("*").order("name");
  if (spaceId) query = query.eq("space_id", spaceId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color, space_id } = await request.json();
  if (!name?.trim() || !space_id) {
    return NextResponse.json({ error: "name and space_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("labels")
    .insert({ name: name.trim(), color: color || "#6366f1", space_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves an email to a user ID by:
 * 1. Checking the profiles table (fast path)
 * 2. Falling back to auth.admin.listUsers() (covers users whose profile email is stale/null)
 * If found via auth but no profile exists, upserts a minimal profile so FK joins work.
 */
export async function lookupUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<{ id: string } | null> {
  const normalised = email.trim().toLowerCase();

  // Fast path: profiles table
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", normalised)
    .single();

  if (profile) return profile;

  // Fallback: auth admin API
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return null;

  const authUser = users.find((u) => u.email?.toLowerCase() === normalised);
  if (!authUser) return null;

  // Sync a minimal profile so future fast-path lookups work
  await admin.from("profiles").upsert(
    {
      id: authUser.id,
      full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
      email: authUser.email,
      avatar_url: authUser.user_metadata?.avatar_url ?? null,
    },
    { onConflict: "id" }
  );

  return { id: authUser.id };
}

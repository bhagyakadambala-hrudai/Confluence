import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves an email to a user ID by:
 * 1. Checking the profiles table (fast path)
 * 2. Falling back to auth.admin.listUsers() (covers users whose profile email is stale/null)
 * If found via auth but no profile exists, upserts a minimal profile so FK joins work.
 *
 * Returns { id, needsInvite: true } when the user has an auth account but has never
 * used Confluence (profile was just bootstrapped) — the caller should send an invite email.
 */
export async function lookupUserByEmail(
  admin: SupabaseClient,
  email: string
): Promise<{ id: string; needsInvite?: boolean } | null> {
  const normalised = email.trim().toLowerCase();

  // Fast path: profiles table (active Confluence user)
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", normalised)
    .single();

  if (profile) return { id: profile.id, needsInvite: false };

  // Fallback: auth admin API
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return null;

  const authUser = users.find((u) => u.email?.toLowerCase() === normalised);
  if (!authUser) return null;

  // Sync a minimal profile so FK joins work
  await admin.from("profiles").upsert(
    {
      id: authUser.id,
      full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
      email: authUser.email,
      avatar_url: authUser.user_metadata?.avatar_url ?? null,
    },
    { onConflict: "id" }
  );

  // User exists in auth but has never used Confluence — needs an invite email
  return { id: authUser.id, needsInvite: true };
}

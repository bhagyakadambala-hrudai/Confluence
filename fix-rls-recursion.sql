-- ============================================================
-- FIX: Recursive RLS policy causing 500 errors
--
-- The problem: spaces policy checks space_members, and
-- space_members policy checks itself (sm2 alias) → infinite recursion
--
-- The fix: use a SECURITY DEFINER helper function to check
-- membership without triggering RLS recursion
-- ============================================================

-- Step 1: Create a security-definer helper (bypasses RLS, no recursion)
create or replace function public.is_space_member(space_uuid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.space_members
    where space_id = space_uuid and user_id = auth.uid()
  )
$$;

-- Step 2: Drop the recursive policies
drop policy if exists "Spaces visible to members" on public.spaces;
drop policy if exists "Members can view space members" on public.space_members;

-- Step 3: Re-create them using the helper (no self-reference)
create policy "Spaces visible to members"
  on public.spaces for select using (
    owner_id = auth.uid() or is_space_member(id)
  );

create policy "Members can view space members"
  on public.space_members for select using (
    user_id = auth.uid() or is_space_member(space_id)
  );

-- Also simplify pages / labels / comments policies to avoid any
-- secondary recursion via the spaces table

drop policy if exists "Pages visible to space members" on public.pages;
create policy "Pages visible to space members"
  on public.pages for select using (
    exists (select 1 from public.spaces where id = pages.space_id and owner_id = auth.uid())
    or is_space_member(pages.space_id)
  );

drop policy if exists "Space members can create pages" on public.pages;
create policy "Space members can create pages"
  on public.pages for insert with check (
    exists (select 1 from public.spaces where id = pages.space_id and owner_id = auth.uid())
    or is_space_member(pages.space_id)
  );

drop policy if exists "Space members can update pages" on public.pages;
create policy "Space members can update pages"
  on public.pages for update using (
    exists (select 1 from public.spaces where id = pages.space_id and owner_id = auth.uid())
    or is_space_member(pages.space_id)
  );

drop policy if exists "Space members can delete pages" on public.pages;
create policy "Space members can delete pages"
  on public.pages for delete using (
    exists (select 1 from public.spaces where id = pages.space_id and owner_id = auth.uid())
    or is_space_member(pages.space_id)
  );

drop policy if exists "Labels visible to space members" on public.labels;
create policy "Labels visible to space members"
  on public.labels for select using (
    exists (select 1 from public.spaces where id = labels.space_id and owner_id = auth.uid())
    or is_space_member(labels.space_id)
  );

drop policy if exists "Space members can create labels" on public.labels;
create policy "Space members can create labels"
  on public.labels for insert with check (
    exists (select 1 from public.spaces where id = labels.space_id and owner_id = auth.uid())
    or is_space_member(labels.space_id)
  );

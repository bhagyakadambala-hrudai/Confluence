-- ============================================================
-- Confluence Clone — Permissions, Teams & Access Control
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Expand space_members roles (owner / admin / editor / viewer)
ALTER TABLE public.space_members
  DROP CONSTRAINT IF EXISTS space_members_role_check;
ALTER TABLE public.space_members
  ADD CONSTRAINT space_members_role_check
  CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

-- Migrate legacy 'member' rows to 'editor'
UPDATE public.space_members SET role = 'editor' WHERE role = 'member';

-- 2. Add access_mode to pages
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS access_mode text DEFAULT 'inherit'
  CHECK (access_mode IN ('inherit', 'restricted'));

-- 3. Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  avatar_url text,
  owner_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id uuid REFERENCES public.teams ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 4. Page permissions
CREATE TABLE IF NOT EXISTS public.page_permissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  page_id uuid REFERENCES public.pages ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams ON DELETE CASCADE,
  can_view boolean DEFAULT true,
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT page_permissions_one_subject CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL)
  )
);

-- 5. RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;

-- Teams policies
DROP POLICY IF EXISTS "Team visible to members" ON public.teams;
CREATE POLICY "Team visible to members" ON public.teams FOR SELECT
  USING (owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Team owner manages team" ON public.teams;
CREATE POLICY "Team owner manages team" ON public.teams FOR ALL USING (owner_id = auth.uid());

-- Team members policies
DROP POLICY IF EXISTS "Team members visible to team" ON public.team_members;
CREATE POLICY "Team members visible to team" ON public.team_members FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Team owner manages members" ON public.team_members;
CREATE POLICY "Team owner manages members" ON public.team_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "User can join team" ON public.team_members;
CREATE POLICY "User can join team" ON public.team_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- Page permissions policies
DROP POLICY IF EXISTS "Page permissions visible to space members" ON public.page_permissions;
CREATE POLICY "Page permissions visible to space members" ON public.page_permissions FOR SELECT
  USING (is_space_member((SELECT space_id FROM public.pages WHERE id = page_permissions.page_id)));

DROP POLICY IF EXISTS "Space admin manages page permissions" ON public.page_permissions;
CREATE POLICY "Space admin manages page permissions" ON public.page_permissions FOR ALL
  USING (is_space_member((SELECT space_id FROM public.pages WHERE id = page_permissions.page_id)));

-- 6. inherit_permission: controls whether space editors can edit (or only view) a specific page
--    when access_mode = 'inherit'. Default 'edit' = space editors can edit.
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS inherit_permission text DEFAULT 'edit'
  CHECK (inherit_permission IN ('view', 'edit'));

-- 7. Space visibility: 'public' = anyone in the org can discover/join the space,
--    'private' = invite-only (default)
ALTER TABLE public.spaces
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'private'
  CHECK (visibility IN ('public', 'private'));

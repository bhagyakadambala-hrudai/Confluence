-- ============================================================
-- Teams tables — run this in Supabase SQL Editor
-- (safe to run multiple times — uses IF NOT EXISTS)
-- ============================================================

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

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Teams: visible to owner or any member
CREATE POLICY IF NOT EXISTS "Team visible to members" ON public.teams FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid())
  );

-- Teams: owner can do everything
CREATE POLICY IF NOT EXISTS "Team owner manages team" ON public.teams FOR ALL
  USING (owner_id = auth.uid());

-- Team members: visible to the member themselves or the team owner
CREATE POLICY IF NOT EXISTS "Team members visible to team" ON public.team_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
  );

-- Team members: owner manages
CREATE POLICY IF NOT EXISTS "Team owner manages members" ON public.team_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND owner_id = auth.uid())
  );

-- Also expand space_members roles to include editor/viewer (skips if already done)
ALTER TABLE public.space_members
  DROP CONSTRAINT IF EXISTS space_members_role_check;
ALTER TABLE public.space_members
  ADD CONSTRAINT space_members_role_check
  CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'member'));

-- Migrate old 'member' rows to 'editor'
UPDATE public.space_members SET role = 'editor' WHERE role = 'member';

-- Force-delete "harish team" and all its members
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_team_id uuid;
BEGIN
  SELECT id INTO v_team_id FROM public.teams WHERE lower(name) = 'harish team' LIMIT 1;

  IF v_team_id IS NULL THEN
    RAISE NOTICE 'Team "harish team" not found.';
  ELSE
    DELETE FROM public.team_members WHERE team_id = v_team_id;
    DELETE FROM public.teams WHERE id = v_team_id;
    RAISE NOTICE 'Team "harish team" (id: %) deleted successfully.', v_team_id;
  END IF;
END $$;

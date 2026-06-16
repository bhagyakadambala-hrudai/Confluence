-- Run this in Supabase SQL Editor to enable email invitations

CREATE TABLE IF NOT EXISTS public.pending_invites (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text NOT NULL,
  space_id uuid REFERENCES public.spaces ON DELETE CASCADE,
  page_id uuid REFERENCES public.pages ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor',
  can_view boolean DEFAULT true,
  can_edit boolean DEFAULT false,
  invited_by uuid REFERENCES auth.users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;

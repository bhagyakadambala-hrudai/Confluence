-- Add status column to spaces
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'trashed'));

-- Space watches table
CREATE TABLE IF NOT EXISTS public.space_watches (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  space_id uuid REFERENCES public.spaces ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(space_id, user_id)
);
ALTER TABLE public.space_watches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own watches" ON space_watches;
CREATE POLICY "Users manage own watches" ON space_watches FOR ALL USING (user_id = auth.uid());

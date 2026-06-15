-- Add is_draft column to pages
-- Run this in Supabase SQL Editor

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT true;

-- Existing pages are considered published (not drafts)
UPDATE public.pages SET is_draft = false WHERE is_draft = true;

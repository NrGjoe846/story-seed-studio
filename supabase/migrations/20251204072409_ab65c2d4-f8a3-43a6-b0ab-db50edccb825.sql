-- Add comment column to votes table for judge reviews
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS comment TEXT;
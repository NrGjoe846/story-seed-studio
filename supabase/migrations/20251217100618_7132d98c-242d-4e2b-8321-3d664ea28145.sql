-- Add voting_open column to events table for admin control of community voting
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS voting_open boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.events.voting_open IS 'Admin-controlled flag to open/close community voting for this event';
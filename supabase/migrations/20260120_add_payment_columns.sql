-- Create a migration to add payment and unique key columns to registration tables

-- Add columns to public.registrations
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS unique_key text UNIQUE;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_details jsonb;

-- Add columns to public.clg_registrations
ALTER TABLE public.clg_registrations ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.clg_registrations ADD COLUMN IF NOT EXISTS unique_key text UNIQUE;
ALTER TABLE public.clg_registrations ADD COLUMN IF NOT EXISTS payment_details jsonb;

-- Update RLS policies if necessary (assuming they already allow access based on user_id)
-- Ensure unique_key is indexed for faster lookup
CREATE INDEX IF NOT EXISTS idx_registrations_unique_key ON public.registrations(unique_key);
CREATE INDEX IF NOT EXISTS idx_clg_registrations_unique_key ON public.clg_registrations(unique_key);

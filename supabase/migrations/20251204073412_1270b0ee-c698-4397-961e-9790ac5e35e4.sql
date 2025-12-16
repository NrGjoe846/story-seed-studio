-- Add prize and winner columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS prize_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS prize_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES public.registrations(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS runner_up_id UUID REFERENCES public.registrations(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS second_runner_up_id UUID REFERENCES public.registrations(id) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS results_announced BOOLEAN DEFAULT FALSE;
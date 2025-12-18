-- Remove prize_amount and prize_currency columns from events table
ALTER TABLE public.events DROP COLUMN IF EXISTS prize_amount;
ALTER TABLE public.events DROP COLUMN IF EXISTS prize_currency;
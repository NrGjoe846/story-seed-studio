-- Add registration deadline column to events table
ALTER TABLE public.events 
ADD COLUMN registration_deadline timestamp with time zone;
-- Add class_level column to registrations table
ALTER TABLE public.registrations
ADD COLUMN class_level text;

-- Add registration_open column to events table (defaults to true)
ALTER TABLE public.events
ADD COLUMN registration_open boolean DEFAULT true;
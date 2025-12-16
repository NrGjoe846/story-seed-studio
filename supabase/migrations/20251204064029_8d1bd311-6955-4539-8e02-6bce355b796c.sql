-- Fix the events table RLS policy - change "Anyone can view active events" to PERMISSIVE
-- First drop the restrictive policy
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;

-- Recreate as PERMISSIVE policy (default)
CREATE POLICY "Anyone can view active events" 
ON public.events 
FOR SELECT 
USING (is_active = true);

-- Also add a unique constraint on views table to ensure one view per user per registration
-- This prevents duplicate view inserts at database level
ALTER TABLE public.views 
ADD CONSTRAINT views_user_registration_unique 
UNIQUE (user_id, registration_id);
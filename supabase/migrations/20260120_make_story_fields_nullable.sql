-- Migration to make story-related columns nullable in registration tables
-- This allows users to complete payment first and submit story details later

-- Update registrations table
ALTER TABLE public.registrations 
  ALTER COLUMN story_title DROP NOT NULL,
  ALTER COLUMN story_description DROP NOT NULL,
  ALTER COLUMN category DROP NOT NULL;

-- Update clg_registrations table
ALTER TABLE public.clg_registrations 
  ALTER COLUMN story_title DROP NOT NULL,
  ALTER COLUMN story_description DROP NOT NULL,
  ALTER COLUMN category DROP NOT NULL;

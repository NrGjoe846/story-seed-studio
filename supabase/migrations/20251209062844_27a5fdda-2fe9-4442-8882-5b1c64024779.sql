-- Clear all data from tables (in correct order due to foreign keys)

-- First, clear tables that reference registrations
DELETE FROM public.comments;
DELETE FROM public.views;
DELETE FROM public.voter_details;
DELETE FROM public.votes;

-- Clear events foreign key references to registrations
UPDATE public.events SET winner_id = NULL, runner_up_id = NULL, second_runner_up_id = NULL;

-- Clear registrations
DELETE FROM public.registrations;

-- Clear remaining tables
DELETE FROM public.events;
DELETE FROM public.admin_notifications;
DELETE FROM public.admin_settings;
DELETE FROM public.contact_submissions;
DELETE FROM public.gallery_images;
DELETE FROM public.judge_settings;
DELETE FROM public.newsletter_subscribers;
DELETE FROM public.otp_codes;
DELETE FROM public.trending_interactions;
DELETE FROM public.user_settings;

-- Clear user-related tables (profiles and user_roles will be recreated when new users are added)
DELETE FROM public.user_roles;
DELETE FROM public.profiles;
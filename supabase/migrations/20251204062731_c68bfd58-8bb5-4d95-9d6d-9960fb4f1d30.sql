-- Add overall_views column to registrations table
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS overall_views integer NOT NULL DEFAULT 0;

-- Create user_settings table
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  voting_reminders boolean DEFAULT true,
  event_updates boolean DEFAULT true,
  theme text DEFAULT 'system',
  language text DEFAULT 'en',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all settings" ON public.user_settings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create admin_settings table
CREATE TABLE public.admin_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  competition_updates boolean DEFAULT true,
  judge_alerts boolean DEFAULT true,
  user_registrations boolean DEFAULT false,
  two_factor_auth boolean DEFAULT false,
  login_alerts boolean DEFAULT true,
  about text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage their own settings" ON public.admin_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id);

-- Create judge_settings table
CREATE TABLE public.judge_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  review_reminders boolean DEFAULT true,
  expertise text,
  bio text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Judges can manage their own settings" ON public.judge_settings FOR ALL USING (has_role(auth.uid(), 'judge'::app_role) AND auth.uid() = user_id);
CREATE POLICY "Admins can view judge settings" ON public.judge_settings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL, -- 'registration', 'judge_feedback', 'vote', 'comment'
  title text NOT NULL,
  description text,
  reference_id uuid, -- ID of the related entity
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notifications" ON public.admin_notifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create unique constraint on votes to prevent duplicate voting
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_user_registration_unique;
ALTER TABLE public.votes ADD CONSTRAINT votes_user_registration_unique UNIQUE (user_id, registration_id);

-- Remove update policy on votes (vote once only, no changes)
DROP POLICY IF EXISTS "Users can update their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.votes;

-- Remove update/delete policy on comments (no editing after submission)
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE judge_settings;

-- Create triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_judge_settings_updated_at BEFORE UPDATE ON public.judge_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create admin notification on new registration
CREATE OR REPLACE FUNCTION public.notify_admin_on_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, description, reference_id)
  VALUES (
    'registration',
    'New Registration',
    'New story submission: ' || NEW.story_title || ' by ' || NEW.first_name || ' ' || NEW.last_name,
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_registration
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_registration();

-- Function to create admin notification on new vote
CREATE OR REPLACE FUNCTION public.notify_admin_on_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, description, reference_id)
  VALUES (
    'vote',
    'New Vote',
    'A new vote of ' || NEW.score || '/10 was submitted',
    NEW.registration_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_vote
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_on_vote();

-- Function to update overall_views on registration when a view is added
CREATE OR REPLACE FUNCTION public.update_registration_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.registrations
  SET overall_views = (
    SELECT COUNT(*) FROM public.views WHERE registration_id = NEW.registration_id
  )
  WHERE id = NEW.registration_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_view
  AFTER INSERT ON public.views
  FOR EACH ROW EXECUTE FUNCTION public.update_registration_views();
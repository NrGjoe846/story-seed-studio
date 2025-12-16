-- Create a new table for college registrations
CREATE TABLE public.clg_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_id UUID REFERENCES public.events(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER NOT NULL,
  city TEXT NOT NULL,
  college_name TEXT,
  degree TEXT,
  branch TEXT,
  story_title TEXT NOT NULL,
  category TEXT NOT NULL,
  story_description TEXT NOT NULL,
  pdf_url TEXT,
  overall_votes INTEGER NOT NULL DEFAULT 0,
  overall_views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clg_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clg_registrations
CREATE POLICY "Anyone can insert clg_registrations"
ON public.clg_registrations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view clg_registrations"
ON public.clg_registrations
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage clg_registrations"
ON public.clg_registrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Judges can view clg_registrations"
ON public.clg_registrations
FOR SELECT
USING (has_role(auth.uid(), 'judge'::app_role));

CREATE POLICY "Users can update their own clg_registrations"
ON public.clg_registrations
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clg_registrations_updated_at
BEFORE UPDATE ON public.clg_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a votes trigger for clg_registrations to update overall_votes
CREATE OR REPLACE FUNCTION public.update_clg_registration_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clg_registrations
    SET overall_votes = (
      SELECT COUNT(*) FROM public.clg_votes WHERE registration_id = NEW.registration_id
    )
    WHERE id = NEW.registration_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clg_registrations
    SET overall_votes = (
      SELECT COUNT(*) FROM public.clg_votes WHERE registration_id = OLD.registration_id
    )
    WHERE id = OLD.registration_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create a separate votes table for college registrations
CREATE TABLE public.clg_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  registration_id UUID NOT NULL REFERENCES public.clg_registrations(id),
  score INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, registration_id)
);

-- Enable RLS on clg_votes
ALTER TABLE public.clg_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clg_votes
CREATE POLICY "Users can insert their own clg_votes"
ON public.clg_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all clg_votes"
ON public.clg_votes
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all clg_votes"
ON public.clg_votes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update overall_votes in clg_registrations
CREATE TRIGGER update_clg_registration_votes_on_insert
AFTER INSERT ON public.clg_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_clg_registration_votes();

CREATE TRIGGER update_clg_registration_votes_on_delete
AFTER DELETE ON public.clg_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_clg_registration_votes();
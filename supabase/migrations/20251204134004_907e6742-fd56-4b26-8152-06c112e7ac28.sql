-- Create trending_interactions table to track user searches and video watches
CREATE TABLE public.trending_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id UUID NOT NULL,
  user_id UUID,
  interaction_type TEXT NOT NULL DEFAULT 'watch', -- 'watch', 'search'
  searched_user_id UUID, -- the user_id that was searched for
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trending_interactions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert trending interactions
CREATE POLICY "Anyone can insert trending interactions" 
ON public.trending_interactions 
FOR INSERT 
WITH CHECK (true);

-- Anyone can view trending interactions for leaderboard
CREATE POLICY "Anyone can view trending interactions" 
ON public.trending_interactions 
FOR SELECT 
USING (true);

-- Create function to update overall_votes when votes change
CREATE OR REPLACE FUNCTION public.update_registration_votes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.registrations
    SET overall_votes = (
      SELECT COUNT(*) FROM public.votes WHERE registration_id = NEW.registration_id
    )
    WHERE id = NEW.registration_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.registrations
    SET overall_votes = (
      SELECT COUNT(*) FROM public.votes WHERE registration_id = OLD.registration_id
    )
    WHERE id = OLD.registration_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for votes
CREATE TRIGGER update_votes_count
AFTER INSERT OR DELETE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.update_registration_votes();

-- Sync existing votes to overall_votes column
UPDATE public.registrations r
SET overall_votes = (
  SELECT COUNT(*) FROM public.votes v WHERE v.registration_id = r.id
);
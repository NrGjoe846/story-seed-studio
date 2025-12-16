-- Create voter_details table for tracking voter information and 24-hour cooldown
CREATE TABLE public.voter_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate votes within 24 hours (handled in application logic)
CREATE INDEX idx_voter_details_phone ON public.voter_details(phone);
CREATE INDEX idx_voter_details_registration ON public.voter_details(registration_id);
CREATE INDEX idx_voter_details_created_at ON public.voter_details(created_at);

-- Enable Row Level Security
ALTER TABLE public.voter_details ENABLE ROW LEVEL SECURITY;

-- Anyone can insert voter details (for voting)
CREATE POLICY "Anyone can insert voter details" 
ON public.voter_details 
FOR INSERT 
WITH CHECK (true);

-- Anyone can view voter details (to check cooldown)
CREATE POLICY "Anyone can view voter details" 
ON public.voter_details 
FOR SELECT 
USING (true);

-- Admins can manage all voter details
CREATE POLICY "Admins can manage voter details" 
ON public.voter_details 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));
-- Add overall_votes column to registrations table
ALTER TABLE public.registrations 
ADD COLUMN overall_votes integer NOT NULL DEFAULT 0;

-- Create RLS policy for judges to view all registrations
CREATE POLICY "Judges can view all registrations" 
ON public.registrations 
FOR SELECT 
USING (has_role(auth.uid(), 'judge'::app_role));

-- Add profile fields for extended user data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS institution text,
ADD COLUMN IF NOT EXISTS grade text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS guardian_name text,
ADD COLUMN IF NOT EXISTS guardian_contact text;

-- Create policy for users to insert their own profile (for new signups)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);
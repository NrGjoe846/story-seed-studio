-- Update RLS policy to allow anonymous inserts to registrations (without user_id requirement)
DROP POLICY IF EXISTS "Users can insert their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Anyone can insert registrations" ON public.registrations;

-- Allow anyone to insert registrations (for anonymous/phone-based users)
CREATE POLICY "Anyone can insert registrations" 
ON public.registrations 
FOR INSERT 
WITH CHECK (true);

-- Update existing policy to allow viewing registrations by phone number
DROP POLICY IF EXISTS "Anyone can view registrations by phone" ON public.registrations;
CREATE POLICY "Anyone can view registrations by phone" 
ON public.registrations 
FOR SELECT 
USING (true);
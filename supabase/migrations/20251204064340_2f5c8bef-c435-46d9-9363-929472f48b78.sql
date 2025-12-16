-- Add a permissive policy to allow all authenticated users to view registrations for the explore page
CREATE POLICY "Authenticated users can view all registrations for explore" 
ON public.registrations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);
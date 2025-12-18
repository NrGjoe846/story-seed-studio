-- Allow anyone to view registrations for public leaderboard
CREATE POLICY "Anyone can view registrations for leaderboard" 
ON public.registrations 
FOR SELECT 
USING (true);
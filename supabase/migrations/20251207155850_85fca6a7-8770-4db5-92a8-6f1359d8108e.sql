-- Drop the existing restrictive ALL policy for admins
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

-- Create separate permissive policies for each operation
CREATE POLICY "Admins can view all events" 
ON public.events 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert events" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update events" 
ON public.events 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events" 
ON public.events 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
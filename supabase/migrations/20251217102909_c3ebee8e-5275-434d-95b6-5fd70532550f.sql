-- Create a security definer function to get judge user IDs for public leaderboard access
CREATE OR REPLACE FUNCTION public.get_judge_user_ids()
RETURNS TABLE (user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id
  FROM public.user_roles ur
  WHERE ur.role = 'judge'
$$;
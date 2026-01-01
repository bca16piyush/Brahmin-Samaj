-- Drop the overly permissive policy that allows any authenticated user to view verified profiles
DROP POLICY IF EXISTS "Authenticated users can view verified profiles" ON public.profiles;

-- The existing policies are sufficient:
-- "Users can view their own profile" - users can see their own data
-- "Admins can view all profiles" - admins have full access
-- No need for authenticated users to view other verified profiles
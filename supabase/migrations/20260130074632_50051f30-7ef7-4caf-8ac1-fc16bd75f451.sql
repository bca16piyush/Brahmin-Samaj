-- Fix profiles table security: Remove overly permissive policy and ensure strict self/admin access only
-- Drop any policy that allows broad profile access
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Verified users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- The existing policies "Users can view own profile" and "Admins can view all profiles" 
-- are already correctly scoped with auth.uid() IS NOT NULL checks
-- No additional changes needed - removing the permissive policy is sufficient
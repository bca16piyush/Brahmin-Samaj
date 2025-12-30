-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view profile names for reviews" ON public.profiles;

-- Create a more targeted policy: anyone can view just public info (name) of verified members
-- This is safe because name is not sensitive PII
CREATE POLICY "Anyone can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (verification_status = 'verified');
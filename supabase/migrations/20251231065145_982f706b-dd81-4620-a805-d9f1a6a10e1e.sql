-- Drop the overly permissive policy that exposes all profile fields to unauthenticated users
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;

-- Create a restricted policy: only authenticated users can view verified profiles
-- This prevents unauthenticated scraping of sensitive PII
CREATE POLICY "Authenticated users can view verified profiles" 
ON public.profiles 
FOR SELECT 
USING (
  verification_status = 'verified' 
  AND auth.uid() IS NOT NULL
);
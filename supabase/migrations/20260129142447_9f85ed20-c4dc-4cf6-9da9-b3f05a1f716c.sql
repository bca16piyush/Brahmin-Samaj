-- Fix 1: Restrict pandits table SELECT to admins only
-- This forces all queries to go through pandits_public view which masks phone/whatsapp
DROP POLICY IF EXISTS "Authenticated users can view active pandits via view" ON public.pandits;

-- Only admins can directly select from pandits table
-- Regular users must use the pandits_public view
CREATE POLICY "Only admins can select from pandits directly"
ON public.pandits
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Remove the overly permissive rate_limits policy and replace with restrictive one
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Deny all access from authenticated users - only service role can access
-- Service role bypasses RLS entirely, so we just deny everyone else
CREATE POLICY "No direct access to rate limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);
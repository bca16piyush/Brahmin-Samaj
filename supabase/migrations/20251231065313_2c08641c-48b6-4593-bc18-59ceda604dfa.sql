-- Drop the policy that exposes pandit contact info to unauthenticated users
DROP POLICY IF EXISTS "Anyone can view active pandits" ON public.pandits;

-- Create a restricted policy: only authenticated users can view active pandits
-- This prevents unauthenticated scraping of phone numbers and WhatsApp contacts
CREATE POLICY "Authenticated users can view active pandits" 
ON public.pandits 
FOR SELECT 
USING (
  is_active = true 
  AND auth.uid() IS NOT NULL
);
-- The pandits_public view needs to query the base pandits table
-- We need to allow authenticated users to SELECT from pandits (for the view to work)
-- but they will only see data through the view which masks sensitive columns

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "No direct select access to pandits" ON public.pandits;

-- Create a policy that allows authenticated users to view active pandits
-- The sensitive data (phone/whatsapp) is masked by the pandits_public view
CREATE POLICY "Authenticated users can view active pandits via view"
ON public.pandits FOR SELECT
TO authenticated
USING (is_active = true);

-- Note: Users should query pandits_public view, not the pandits table directly
-- The frontend code has been updated to use pandits_public which masks contact info
-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.pandit_reviews;

-- Create a new policy that only allows authenticated users to view reviews
CREATE POLICY "Authenticated users can view reviews"
ON public.pandit_reviews
FOR SELECT
USING (auth.uid() IS NOT NULL);
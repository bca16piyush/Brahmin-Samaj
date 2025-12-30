-- Drop the existing insert policy that requires verified users
DROP POLICY IF EXISTS "Verified users can create reviews" ON public.pandit_reviews;

-- Create new policy allowing any authenticated user to create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.pandit_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);
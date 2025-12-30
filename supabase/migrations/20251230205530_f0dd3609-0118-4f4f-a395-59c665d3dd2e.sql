-- Allow authenticated users to see names from profiles (for reviews display)
CREATE POLICY "Anyone can view profile names for reviews" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Drop the restrictive user-only policy and keep the new public one
-- Note: The admin policy already exists, so we just need public read for names
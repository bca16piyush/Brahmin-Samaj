-- Fix security issue: Block anonymous access to notification_subscriptions
-- Add a restrictive policy that requires authentication for all operations
CREATE POLICY "Block anonymous access to notification_subscriptions"
ON public.notification_subscriptions
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix security issue: Block anonymous access to monetary_donations
-- Add a restrictive policy that requires authentication for all operations
CREATE POLICY "Block anonymous access to monetary_donations"
ON public.monetary_donations
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
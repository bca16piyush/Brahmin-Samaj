-- Fix notification_subscriptions RLS - split ALL policy into specific operations
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.notification_subscriptions;

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.notification_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own subscriptions (with explicit user_id check)
CREATE POLICY "Users can insert their own subscriptions"
ON public.notification_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
ON public.notification_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions"
ON public.notification_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
-- Fix notification_subscriptions RLS policies
-- Drop existing policies and recreate them as proper PERMISSIVE policies

-- Drop all existing policies on notification_subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.notification_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.notification_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.notification_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.notification_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.notification_subscriptions;

-- Ensure RLS is enabled
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner as well (prevents bypassing)
ALTER TABLE public.notification_subscriptions FORCE ROW LEVEL SECURITY;

-- Create proper PERMISSIVE SELECT policies (user OR admin can view)
CREATE POLICY "Users can view own subscriptions"
ON public.notification_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.notification_subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- INSERT: Only authenticated users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
ON public.notification_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only owner can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
ON public.notification_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Only owner can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
ON public.notification_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
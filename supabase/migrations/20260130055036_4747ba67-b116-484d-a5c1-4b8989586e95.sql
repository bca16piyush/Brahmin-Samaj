-- Remove the admin policy that allows viewing all raw WhatsApp numbers
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.notification_subscriptions;

-- Create a view with masked WhatsApp numbers for admin browsing
CREATE OR REPLACE VIEW public.notification_subscriptions_admin AS
SELECT 
  id,
  user_id,
  push_subscription,
  email_notifications,
  whatsapp_notifications,
  created_at,
  -- Mask WhatsApp number: show only last 4 digits
  CASE 
    WHEN whatsapp_number IS NOT NULL AND length(whatsapp_number) > 4 
    THEN '****' || right(whatsapp_number, 4)
    ELSE whatsapp_number
  END as whatsapp_number_masked
FROM public.notification_subscriptions;

-- Grant select on the view to authenticated users (will be controlled by RLS-like function checks)
GRANT SELECT ON public.notification_subscriptions_admin TO authenticated;

-- Create a function to check if user can access admin view
CREATE OR REPLACE FUNCTION public.get_notification_subscriptions_for_admin()
RETURNS SETOF public.notification_subscriptions_admin
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.notification_subscriptions_admin
  WHERE has_role(auth.uid(), 'admin'::app_role)
$$;

-- Create a secure function for edge functions to get full WhatsApp numbers
-- This uses SECURITY DEFINER and only returns data needed for sending notifications
CREATE OR REPLACE FUNCTION public.get_whatsapp_recipients_for_notification()
RETURNS TABLE (
  user_id uuid,
  whatsapp_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, whatsapp_number 
  FROM public.notification_subscriptions
  WHERE whatsapp_notifications = true 
    AND whatsapp_number IS NOT NULL
$$;

-- Add comment explaining the security model
COMMENT ON VIEW public.notification_subscriptions_admin IS 
'Admin view with masked WhatsApp numbers to prevent bulk harvesting. Full numbers only accessible via service role or dedicated secure functions.';

COMMENT ON FUNCTION public.get_whatsapp_recipients_for_notification IS 
'Secure function for edge functions to get WhatsApp recipients. Uses SECURITY DEFINER to bypass RLS.';
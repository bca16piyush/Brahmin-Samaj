-- Drop the function first, then the view
DROP FUNCTION IF EXISTS public.get_notification_subscriptions_for_admin() CASCADE;
DROP VIEW IF EXISTS public.notification_subscriptions_admin CASCADE;

-- Recreate the view with explicit SECURITY INVOKER 
CREATE VIEW public.notification_subscriptions_admin 
WITH (security_invoker = on)
AS
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

-- Grant select on the view to authenticated users
GRANT SELECT ON public.notification_subscriptions_admin TO authenticated;

-- Recreate the admin function with explicit return type (not dependent on view type)
CREATE OR REPLACE FUNCTION public.get_notification_subscriptions_for_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  push_subscription jsonb,
  email_notifications boolean,
  whatsapp_notifications boolean,
  created_at timestamptz,
  whatsapp_number_masked text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ns.id,
    ns.user_id,
    ns.push_subscription,
    ns.email_notifications,
    ns.whatsapp_notifications,
    ns.created_at,
    CASE 
      WHEN ns.whatsapp_number IS NOT NULL AND length(ns.whatsapp_number) > 4 
      THEN '****' || right(ns.whatsapp_number, 4)
      ELSE ns.whatsapp_number
    END as whatsapp_number_masked
  FROM public.notification_subscriptions ns
  WHERE has_role(auth.uid(), 'admin'::app_role)
$$;

-- Add a new admin policy for management operations (UPDATE, DELETE, INSERT)
-- Note: Admins use the secure function for SELECT to get masked numbers
CREATE POLICY "Admins can manage subscriptions"
ON public.notification_subscriptions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Comments
COMMENT ON VIEW public.notification_subscriptions_admin IS 
'Admin view with masked WhatsApp numbers. Uses security_invoker=on for proper RLS enforcement.';

COMMENT ON FUNCTION public.get_notification_subscriptions_for_admin IS 
'Secure admin function returning masked WhatsApp numbers to prevent bulk harvesting.';
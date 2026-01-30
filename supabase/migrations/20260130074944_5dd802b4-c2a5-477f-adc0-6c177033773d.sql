-- Fix security issue 1: Update pandits_public view to properly mask contact info
-- Only show phone/whatsapp to admins or users with confirmed bookings
DROP VIEW IF EXISTS public.pandits_public;

CREATE VIEW public.pandits_public AS
SELECT 
  p.id,
  p.name,
  p.photo_url,
  p.expertise,
  p.location,
  p.bio,
  p.availability,
  p.experience_start_date,
  p.weekly_availability,
  p.is_active,
  p.created_at,
  p.updated_at,
  -- Only expose contact info to admins or users with confirmed bookings
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN p.phone
    WHEN has_confirmed_booking(auth.uid(), p.id) THEN p.phone
    ELSE NULL
  END as phone,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN p.whatsapp
    WHEN has_confirmed_booking(auth.uid(), p.id) THEN p.whatsapp
    ELSE NULL
  END as whatsapp
FROM public.pandits p
WHERE p.is_active = true;

-- Grant access to the view
GRANT SELECT ON public.pandits_public TO authenticated;
GRANT SELECT ON public.pandits_public TO anon;

-- Fix security issue 2: Drop the admin view and use the function instead
-- The notification_subscriptions_admin view should not exist as a separate view
-- Admins should only access via the get_notification_subscriptions_for_admin() function
DROP VIEW IF EXISTS public.notification_subscriptions_admin;

-- Fix security issue 3: Update in_kind_donations to hide donor contact info from non-admin users
-- Create a view for user-facing donation data without sensitive donor info
CREATE OR REPLACE VIEW public.in_kind_donations_user AS
SELECT 
  id,
  user_id,
  item_type,
  quantity,
  dropoff_location,
  status,
  notes,
  received_at,
  created_at,
  -- Only show contact info to the owner or admins
  CASE 
    WHEN auth.uid() = user_id THEN donor_phone
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN donor_phone
    ELSE NULL
  END as donor_phone,
  CASE 
    WHEN auth.uid() = user_id THEN donor_address
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN donor_address
    ELSE NULL
  END as donor_address
FROM public.in_kind_donations;

-- Grant access to the view
GRANT SELECT ON public.in_kind_donations_user TO authenticated;
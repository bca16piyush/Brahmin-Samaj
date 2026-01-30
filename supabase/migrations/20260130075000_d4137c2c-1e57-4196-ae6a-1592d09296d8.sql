-- Fix Security Definer View issue by using SECURITY INVOKER
-- The views must use SECURITY INVOKER to respect the calling user's RLS policies

-- Recreate pandits_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.pandits_public;

CREATE VIEW public.pandits_public
WITH (security_invoker = true)
AS
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

-- Recreate in_kind_donations_user view with SECURITY INVOKER
DROP VIEW IF EXISTS public.in_kind_donations_user;

CREATE VIEW public.in_kind_donations_user
WITH (security_invoker = true)
AS
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
-- Fix 1: Update pandits_public view to mask phone/whatsapp for non-admins and users without confirmed bookings
-- This view already has security_invoker=true, but we need to ensure phone/whatsapp are NULL for unauthorized access
DROP VIEW IF EXISTS public.pandits_public;

CREATE VIEW public.pandits_public WITH (security_invoker = true) AS
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
  -- Only show phone/whatsapp to admins or users with confirmed bookings
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

-- Revoke direct access from anon to prevent anonymous data harvesting
REVOKE ALL ON public.pandits_public FROM anon;
GRANT SELECT ON public.pandits_public TO authenticated;

-- Fix 2: Update in_kind_donations_user view to mask donor_phone and donor_address for non-admins/non-owners
DROP VIEW IF EXISTS public.in_kind_donations_user;

CREATE VIEW public.in_kind_donations_user WITH (security_invoker = true) AS
SELECT 
  d.id,
  d.user_id,
  d.item_type,
  d.quantity,
  d.dropoff_location,
  d.status,
  d.notes,
  d.received_at,
  d.created_at,
  -- Only show donor_phone and donor_address to admins or the donor themselves
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN d.donor_phone
    WHEN auth.uid() = d.user_id THEN d.donor_phone
    ELSE NULL 
  END as donor_phone,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN d.donor_address
    WHEN auth.uid() = d.user_id THEN d.donor_address
    ELSE NULL 
  END as donor_address
FROM public.in_kind_donations d;

-- Revoke direct access from anon to prevent anonymous data harvesting
REVOKE ALL ON public.in_kind_donations_user FROM anon;
GRANT SELECT ON public.in_kind_donations_user TO authenticated;
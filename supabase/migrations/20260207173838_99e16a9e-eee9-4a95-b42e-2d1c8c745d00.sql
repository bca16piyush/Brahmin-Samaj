-- Drop and recreate the pandits_public view with security hardening
-- This view masks phone and whatsapp unless user has confirmed booking or is admin

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
  -- Only show phone if user is admin OR has confirmed booking with this pandit
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN p.phone
    WHEN has_confirmed_booking(auth.uid(), p.id) THEN p.phone
    ELSE NULL
  END as phone,
  -- Only show whatsapp if user is admin OR has confirmed booking with this pandit
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN p.whatsapp
    WHEN has_confirmed_booking(auth.uid(), p.id) THEN p.whatsapp
    ELSE NULL
  END as whatsapp
FROM public.pandits p
WHERE p.is_active = true;

-- Revoke access from anonymous users
REVOKE ALL ON public.pandits_public FROM anon;

-- Grant select to authenticated users only
GRANT SELECT ON public.pandits_public TO authenticated;
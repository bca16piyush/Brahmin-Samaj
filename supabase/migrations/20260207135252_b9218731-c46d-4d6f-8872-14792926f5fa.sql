-- Drop and recreate the pandits_public view with proper security
DROP VIEW IF EXISTS public.pandits_public;

-- Recreate view with security_invoker and PII masking
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
  -- Mask phone: only show if user is admin OR has confirmed booking with this pandit
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN p.phone
    WHEN auth.uid() IS NOT NULL AND has_confirmed_booking(auth.uid(), p.id) THEN p.phone
    ELSE NULL
  END AS phone,
  -- Mask whatsapp: only show if user is admin OR has confirmed booking with this pandit
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN p.whatsapp
    WHEN auth.uid() IS NOT NULL AND has_confirmed_booking(auth.uid(), p.id) THEN p.whatsapp
    ELSE NULL
  END AS whatsapp
FROM public.pandits p;

-- Revoke access from anonymous users
REVOKE ALL ON public.pandits_public FROM anon;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.pandits_public TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.pandits_public IS 'Secure view for pandits data. Phone and WhatsApp are masked unless user is admin or has a confirmed booking with the pandit.';
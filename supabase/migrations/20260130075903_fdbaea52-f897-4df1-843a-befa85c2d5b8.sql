-- Drop and recreate pandits_public view with explicit security_invoker
DROP VIEW IF EXISTS public.pandits_public;

CREATE VIEW public.pandits_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  photo_url,
  expertise,
  location,
  bio,
  availability,
  experience_start_date,
  weekly_availability,
  is_active,
  created_at,
  updated_at,
  -- Phone is only visible to admins or users with confirmed bookings
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN phone
    WHEN has_confirmed_booking(auth.uid(), id) THEN phone
    ELSE NULL
  END AS phone,
  -- WhatsApp is only visible to admins or users with confirmed bookings
  CASE
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN whatsapp
    WHEN has_confirmed_booking(auth.uid(), id) THEN whatsapp
    ELSE NULL
  END AS whatsapp
FROM public.pandits
WHERE is_active = true;

-- Add comment explaining the security model
COMMENT ON VIEW public.pandits_public IS 'Secure view for pandit data. Phone and WhatsApp are masked unless user is admin or has confirmed booking with the pandit.';
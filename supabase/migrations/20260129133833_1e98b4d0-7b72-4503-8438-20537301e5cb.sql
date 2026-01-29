-- Function to check if user has a confirmed booking with a pandit
CREATE OR REPLACE FUNCTION public.has_confirmed_booking(_user_id UUID, _pandit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pandit_bookings
    WHERE user_id = _user_id 
      AND pandit_id = _pandit_id
      AND status = 'confirmed'
  )
$$;

-- Create a secure view that masks contact info for most users
CREATE OR REPLACE VIEW public.pandits_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  photo_url,
  expertise,
  location,
  bio,
  experience_start_date,
  weekly_availability,
  is_active,
  availability,
  created_at,
  updated_at,
  -- Only show phone/whatsapp if user is admin OR has confirmed booking
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN phone
    WHEN public.has_confirmed_booking(auth.uid(), id) THEN phone
    ELSE NULL
  END AS phone,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN whatsapp
    WHEN public.has_confirmed_booking(auth.uid(), id) THEN whatsapp
    ELSE NULL
  END AS whatsapp
FROM public.pandits;

-- Drop the old permissive SELECT policy on pandits
DROP POLICY IF EXISTS "Authenticated users can view active pandits" ON public.pandits;

-- Create restrictive policy that denies direct SELECT access (only through view)
CREATE POLICY "No direct select access to pandits"
ON public.pandits FOR SELECT
TO authenticated
USING (
  -- Admins can still access directly for management
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add comment explaining the security model
COMMENT ON VIEW public.pandits_public IS 'Secure view that masks phone/whatsapp unless user has confirmed booking or is admin. Use this view instead of querying pandits table directly.';
COMMENT ON FUNCTION public.has_confirmed_booking IS 'SECURITY DEFINER: Checks if user has a confirmed booking with pandit. Used by pandits_public view.';
-- Drop and recreate the in_kind_donations_user view with proper security
DROP VIEW IF EXISTS public.in_kind_donations_user;

-- Recreate view with security_invoker and PII masking
CREATE VIEW public.in_kind_donations_user WITH (security_invoker = true) AS
SELECT 
  ikd.id,
  ikd.user_id,
  ikd.item_type,
  ikd.quantity,
  ikd.dropoff_location,
  ikd.status,
  ikd.notes,
  ikd.received_at,
  ikd.created_at,
  -- Mask donor_phone: only show if user is admin OR is the record owner
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN ikd.donor_phone
    WHEN auth.uid() IS NOT NULL AND auth.uid() = ikd.user_id THEN ikd.donor_phone
    ELSE NULL
  END AS donor_phone,
  -- Mask donor_address: only show if user is admin OR is the record owner
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN ikd.donor_address
    WHEN auth.uid() IS NOT NULL AND auth.uid() = ikd.user_id THEN ikd.donor_address
    ELSE NULL
  END AS donor_address
FROM public.in_kind_donations ikd;

-- Revoke access from anonymous users
REVOKE ALL ON public.in_kind_donations_user FROM anon;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.in_kind_donations_user TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.in_kind_donations_user IS 'Secure view for in-kind donations. Donor phone and address are masked unless user is admin or the donation owner.';
-- Drop and recreate in_kind_donations_user view with explicit security_invoker
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
  -- Donor phone only visible to owner or admin
  CASE
    WHEN auth.uid() = user_id THEN donor_phone
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN donor_phone
    ELSE NULL
  END AS donor_phone,
  -- Donor address only visible to owner or admin
  CASE
    WHEN auth.uid() = user_id THEN donor_address
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN donor_address
    ELSE NULL
  END AS donor_address
FROM public.in_kind_donations;

-- Add comment explaining the security model
COMMENT ON VIEW public.in_kind_donations_user IS 'Secure view for in-kind donations. Donor phone and address are masked unless user owns the record or is admin.';
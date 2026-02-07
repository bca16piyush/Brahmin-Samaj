-- Drop and recreate the view with security_invoker enabled
DROP VIEW IF EXISTS public.in_kind_donations_user;

CREATE VIEW public.in_kind_donations_user
WITH (security_invoker = true) AS
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
    CASE
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN donor_phone
        WHEN auth.uid() = user_id THEN donor_phone
        ELSE NULL::text
    END AS donor_phone,
    CASE
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN donor_address
        WHEN auth.uid() = user_id THEN donor_address
        ELSE NULL::text
    END AS donor_address
FROM public.in_kind_donations;

-- Revoke access from anonymous users
REVOKE ALL ON public.in_kind_donations_user FROM anon;

-- Grant access only to authenticated users
GRANT SELECT ON public.in_kind_donations_user TO authenticated;
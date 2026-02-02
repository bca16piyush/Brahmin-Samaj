-- Drop and recreate views with security_invoker to inherit base table RLS
-- This ensures views properly respect RLS policies

-- Fix pandits_public view to use security_invoker
DROP VIEW IF EXISTS public.pandits_public;
CREATE VIEW public.pandits_public WITH (security_invoker = true) AS
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
    -- Only expose contact info to admins or users with confirmed bookings
    CASE 
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN phone
        WHEN has_confirmed_booking(auth.uid(), id) THEN phone
        ELSE NULL
    END AS phone,
    CASE 
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN whatsapp
        WHEN has_confirmed_booking(auth.uid(), id) THEN whatsapp
        ELSE NULL
    END AS whatsapp
FROM public.pandits
WHERE is_active = true;

-- Grant access to authenticated users only
REVOKE ALL ON public.pandits_public FROM anon;
GRANT SELECT ON public.pandits_public TO authenticated;

-- Fix in_kind_donations_user view to use security_invoker
DROP VIEW IF EXISTS public.in_kind_donations_user;
CREATE VIEW public.in_kind_donations_user WITH (security_invoker = true) AS
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
    -- Only expose contact info to the donor themselves or admins
    CASE 
        WHEN auth.uid() = user_id THEN donor_phone
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN donor_phone
        ELSE NULL
    END AS donor_phone,
    CASE 
        WHEN auth.uid() = user_id THEN donor_address
        WHEN has_role(auth.uid(), 'admin'::app_role) THEN donor_address
        ELSE NULL
    END AS donor_address
FROM public.in_kind_donations;

-- Grant access to authenticated users only
REVOKE ALL ON public.in_kind_donations_user FROM anon;
GRANT SELECT ON public.in_kind_donations_user TO authenticated;

-- Fix inventory_stock_balance view to use security_invoker and restrict to verified users/admins
DROP VIEW IF EXISTS public.inventory_stock_balance;
CREATE VIEW public.inventory_stock_balance WITH (security_invoker = true) AS
SELECT 
    i.id,
    i.name,
    i.category,
    i.unit,
    i.min_stock_level,
    i.description,
    i.is_active,
    COALESCE(si.total_in, 0)::integer AS total_stock_in,
    COALESCE(so.total_out, 0)::integer AS total_stock_out,
    (COALESCE(si.total_in, 0) - COALESCE(so.total_out, 0))::integer AS current_stock,
    CASE 
        WHEN (COALESCE(si.total_in, 0) - COALESCE(so.total_out, 0)) < i.min_stock_level THEN true
        ELSE false
    END AS is_low_stock
FROM public.inventory_items i
LEFT JOIN (
    SELECT item_id, SUM(quantity)::bigint AS total_in
    FROM public.stock_in
    GROUP BY item_id
) si ON i.id = si.item_id
LEFT JOIN (
    SELECT item_id, SUM(quantity)::bigint AS total_out
    FROM public.stock_out
    GROUP BY item_id
) so ON i.id = so.item_id
WHERE i.is_active = true;

-- Grant access to authenticated users only (underlying table RLS will filter)
REVOKE ALL ON public.inventory_stock_balance FROM anon;
GRANT SELECT ON public.inventory_stock_balance TO authenticated;
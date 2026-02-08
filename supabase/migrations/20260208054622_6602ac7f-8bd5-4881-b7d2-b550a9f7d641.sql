-- Fix inventory_stock_balance view security exposure
-- Recreate the view with security_invoker to respect RLS of underlying tables

-- First, drop the existing view
DROP VIEW IF EXISTS public.inventory_stock_balance;

-- Recreate the view with security_invoker enabled
CREATE VIEW public.inventory_stock_balance
WITH (security_invoker = true) AS
SELECT 
  i.id,
  i.name,
  i.description,
  i.category,
  i.unit,
  i.min_stock_level,
  i.is_active,
  COALESCE(si.total_in, 0) AS total_stock_in,
  COALESCE(so.total_out, 0) AS total_stock_out,
  COALESCE(si.total_in, 0) - COALESCE(so.total_out, 0) AS current_stock,
  (COALESCE(si.total_in, 0) - COALESCE(so.total_out, 0)) < i.min_stock_level AS is_low_stock
FROM public.inventory_items i
LEFT JOIN (
  SELECT item_id, SUM(quantity)::integer AS total_in 
  FROM public.stock_in 
  GROUP BY item_id
) si ON i.id = si.item_id
LEFT JOIN (
  SELECT item_id, SUM(quantity)::integer AS total_out 
  FROM public.stock_out 
  GROUP BY item_id
) so ON i.id = so.item_id;

-- Revoke all access from anonymous users
REVOKE ALL ON public.inventory_stock_balance FROM anon;

-- Grant access only to authenticated users (admins will be filtered by underlying RLS)
GRANT SELECT ON public.inventory_stock_balance TO authenticated;

-- Add comment explaining the security
COMMENT ON VIEW public.inventory_stock_balance IS 'Secured view for inventory stock balance - access restricted to authenticated users only, with underlying RLS from inventory_items, stock_in, and stock_out tables enforcing admin-only access';
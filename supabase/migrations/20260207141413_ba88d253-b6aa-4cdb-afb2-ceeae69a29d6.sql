-- Drop and recreate the inventory_stock_balance view with proper security
DROP VIEW IF EXISTS public.inventory_stock_balance;

-- Recreate view with security_invoker to enforce RLS
CREATE VIEW public.inventory_stock_balance WITH (security_invoker = true) AS
SELECT 
  ii.id,
  ii.name,
  ii.unit,
  ii.description,
  ii.category,
  ii.min_stock_level,
  ii.is_active,
  COALESCE(SUM(si.quantity), 0)::integer AS total_stock_in,
  COALESCE(SUM(so.quantity), 0)::integer AS total_stock_out,
  (COALESCE(SUM(si.quantity), 0) - COALESCE(SUM(so.quantity), 0))::integer AS current_stock,
  (COALESCE(SUM(si.quantity), 0) - COALESCE(SUM(so.quantity), 0)) < ii.min_stock_level AS is_low_stock
FROM public.inventory_items ii
LEFT JOIN public.stock_in si ON ii.id = si.item_id
LEFT JOIN public.stock_out so ON ii.id = so.item_id
WHERE has_role(auth.uid(), 'admin'::app_role)
GROUP BY ii.id, ii.name, ii.unit, ii.description, ii.category, ii.min_stock_level, ii.is_active;

-- Revoke access from anonymous users
REVOKE ALL ON public.inventory_stock_balance FROM anon;

-- Grant SELECT only to authenticated users (view itself filters to admins)
GRANT SELECT ON public.inventory_stock_balance TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.inventory_stock_balance IS 'Secure view for inventory stock balance. Only accessible to admin users.';
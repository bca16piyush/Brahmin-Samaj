-- Fix the view to use SECURITY INVOKER (default but let's be explicit)
DROP VIEW IF EXISTS public.inventory_stock_balance;

CREATE VIEW public.inventory_stock_balance 
WITH (security_invoker = true)
AS
SELECT 
    i.id,
    i.name,
    i.category,
    i.unit,
    i.min_stock_level,
    i.description,
    i.is_active,
    COALESCE(si.total_in, 0)::INTEGER AS total_stock_in,
    COALESCE(so.total_out, 0)::INTEGER AS total_stock_out,
    (COALESCE(si.total_in, 0) - COALESCE(so.total_out, 0))::INTEGER AS current_stock,
    CASE 
        WHEN COALESCE(si.total_in, 0) - COALESCE(so.total_out, 0) < i.min_stock_level THEN true
        ELSE false
    END AS is_low_stock
FROM public.inventory_items i
LEFT JOIN (
    SELECT item_id, SUM(quantity) AS total_in
    FROM public.stock_in
    GROUP BY item_id
) si ON i.id = si.item_id
LEFT JOIN (
    SELECT item_id, SUM(quantity) AS total_out
    FROM public.stock_out
    GROUP BY item_id
) so ON i.id = so.item_id
WHERE i.is_active = true;
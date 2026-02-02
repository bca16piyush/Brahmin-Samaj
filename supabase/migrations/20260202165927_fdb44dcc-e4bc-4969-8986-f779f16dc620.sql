-- Create category enum for inventory items
CREATE TYPE public.inventory_category AS ENUM ('puja_materials', 'food_prasad', 'other');

-- Create products/inventory items table
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category inventory_category NOT NULL DEFAULT 'other',
    unit TEXT NOT NULL DEFAULT 'units', -- e.g., kg, liters, pieces, packets
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create stock_in (entry) table
CREATE TABLE public.stock_in (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    supplier TEXT,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create stock_out (exit) table
CREATE TABLE public.stock_out (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    purpose TEXT, -- e.g., 'Daily Puja', 'Special Event', 'Prasad Distribution'
    customer_name TEXT, -- Optional: if given to someone specific
    exit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create a view that calculates current stock
CREATE OR REPLACE VIEW public.inventory_stock_balance AS
SELECT 
    i.id,
    i.name,
    i.category,
    i.unit,
    i.min_stock_level,
    i.description,
    i.is_active,
    COALESCE(si.total_in, 0) AS total_stock_in,
    COALESCE(so.total_out, 0) AS total_stock_out,
    COALESCE(si.total_in, 0) - COALESCE(so.total_out, 0) AS current_stock,
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

-- Enable RLS on all tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_out ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage inventory

-- inventory_items policies
CREATE POLICY "Admins can manage inventory items"
ON public.inventory_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Verified users can view active inventory items"
ON public.inventory_items
FOR SELECT
USING (is_verified(auth.uid()) AND is_active = true);

-- stock_in policies
CREATE POLICY "Admins can manage stock entries"
ON public.stock_in
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- stock_out policies
CREATE POLICY "Admins can manage stock exits"
ON public.stock_out
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for inventory_items
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
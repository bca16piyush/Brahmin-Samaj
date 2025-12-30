-- Add donor phone and address columns to in_kind_donations table
ALTER TABLE public.in_kind_donations 
ADD COLUMN donor_phone text,
ADD COLUMN donor_address text;
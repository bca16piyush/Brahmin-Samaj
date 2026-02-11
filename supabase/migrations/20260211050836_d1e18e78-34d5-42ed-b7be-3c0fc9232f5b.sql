-- Add aadhaar_last4 column to profiles (stores only last 4 digits)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_last4 text;

-- Add a check constraint to ensure it's exactly 4 digits
ALTER TABLE public.profiles ADD CONSTRAINT aadhaar_last4_format CHECK (aadhaar_last4 IS NULL OR aadhaar_last4 ~ '^\d{4}$');
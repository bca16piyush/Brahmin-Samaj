
-- Add volunteer role to app_role enum (must be in separate migration before use)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'volunteer';

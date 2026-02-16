
-- Add available_from/available_to date columns to rooms for date-range inventory
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS available_from date;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS available_to date;

-- Add category and feeding_system to accommodation_locations
ALTER TABLE public.accommodation_locations ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.accommodation_locations ADD COLUMN IF NOT EXISTS feeding_system text;

-- Index for date-range queries on rooms
CREATE INDEX IF NOT EXISTS idx_rooms_availability_dates ON public.rooms (available_from, available_to);

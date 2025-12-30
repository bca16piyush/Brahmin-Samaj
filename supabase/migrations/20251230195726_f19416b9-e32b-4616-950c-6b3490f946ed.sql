-- Add new columns to events table for enhanced event management
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS registration_limit INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS map_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'Event';

-- Add comment for clarity
COMMENT ON COLUMN public.events.registration_limit IS 'Maximum number of registrations allowed (null = unlimited)';
COMMENT ON COLUMN public.events.map_url IS 'Google Maps embed URL for the event location';
COMMENT ON COLUMN public.events.event_type IS 'Type of event: Festival, Puja, Workshop, Meeting, etc.';
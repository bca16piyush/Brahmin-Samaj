-- Create table for admin-managed expertise options
CREATE TABLE public.pandit_expertise_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.pandit_expertise_options ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view expertise options"
ON public.pandit_expertise_options
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage expertise options"
ON public.pandit_expertise_options
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add experience_start_date to pandits table
ALTER TABLE public.pandits 
ADD COLUMN experience_start_date date;

-- Add weekly_availability as JSONB for structured availability
-- Format: { "monday": { "start": "09:00", "end": "17:00", "enabled": true }, ... }
ALTER TABLE public.pandits 
ADD COLUMN weekly_availability jsonb DEFAULT '{}'::jsonb;

-- Insert some default expertise options
INSERT INTO public.pandit_expertise_options (name) VALUES
  ('Puja & Havan'),
  ('Vedic Astrology'),
  ('Vastu Shastra'),
  ('Wedding Ceremonies'),
  ('Griha Pravesh'),
  ('Satyanarayan Katha'),
  ('Rudrabhishek'),
  ('Navgraha Shanti'),
  ('Last Rites'),
  ('Naming Ceremony');
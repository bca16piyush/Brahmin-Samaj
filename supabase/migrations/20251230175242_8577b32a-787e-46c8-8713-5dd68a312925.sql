-- Create pandit_reviews table
CREATE TABLE public.pandit_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pandit_id uuid NOT NULL REFERENCES public.pandits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  ceremony_type text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(pandit_id, user_id)
);

-- Create pandit_bookings table
CREATE TABLE public.pandit_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pandit_id uuid NOT NULL REFERENCES public.pandits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ceremony_type text NOT NULL,
  booking_date date NOT NULL,
  booking_time text,
  location text,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pandit_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pandit_bookings ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
ON public.pandit_reviews FOR SELECT USING (true);

CREATE POLICY "Verified users can create reviews"
ON public.pandit_reviews FOR INSERT
WITH CHECK (is_verified(auth.uid()));

CREATE POLICY "Users can update their own reviews"
ON public.pandit_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.pandit_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
ON public.pandit_bookings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
ON public.pandit_bookings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Verified users can create bookings"
ON public.pandit_bookings FOR INSERT
WITH CHECK (is_verified(auth.uid()));

CREATE POLICY "Users can update their own pending bookings"
ON public.pandit_bookings FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all bookings"
ON public.pandit_bookings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_pandit_bookings_updated_at
BEFORE UPDATE ON public.pandit_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert test pandit with full data
INSERT INTO public.pandits (
  name,
  photo_url,
  expertise,
  location,
  phone,
  whatsapp,
  bio,
  is_active,
  experience_start_date,
  weekly_availability
) VALUES (
  'Pt. Ramesh Shastri',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
  ARRAY['Puja & Havan', 'Vedic Astrology', 'Wedding Ceremonies'],
  'Varanasi, UP',
  '+91 98765 43210',
  '+919876543210',
  'Renowned Vedic scholar with expertise in ancient rituals, Jyotish Shastra, and traditional wedding ceremonies. Trained at Banaras Hindu University.',
  true,
  '1999-01-15',
  '{"monday": {"enabled": true, "start": "06:00", "end": "20:00"}, "tuesday": {"enabled": true, "start": "06:00", "end": "20:00"}, "wednesday": {"enabled": true, "start": "06:00", "end": "20:00"}, "thursday": {"enabled": true, "start": "06:00", "end": "20:00"}, "friday": {"enabled": true, "start": "06:00", "end": "20:00"}, "saturday": {"enabled": true, "start": "06:00", "end": "18:00"}, "sunday": {"enabled": false, "start": "09:00", "end": "12:00"}}'::jsonb
);
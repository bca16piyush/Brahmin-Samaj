-- Create room type enum
CREATE TYPE public.room_type AS ENUM ('dormitory', 'standard', 'deluxe', 'ac', 'non_ac');

-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');

-- Create room_types table for configurable room categories
CREATE TABLE public.room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type room_type NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 1,
    price_per_night NUMERIC(10, 2) NOT NULL,
    amenities TEXT[] DEFAULT '{}',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rooms table for individual rooms
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id UUID NOT NULL REFERENCES public.room_types(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL UNIQUE,
    floor INTEGER DEFAULT 1,
    notes TEXT,
    is_blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT,
    blocked_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create room_bookings table
CREATE TABLE public.room_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INTEGER NOT NULL DEFAULT 1,
    guest_names TEXT[],
    total_amount NUMERIC(10, 2),
    status booking_status NOT NULL DEFAULT 'pending',
    special_requests TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- Create function to check for booking overlaps
CREATE OR REPLACE FUNCTION public.check_room_availability(
    _room_id UUID,
    _check_in DATE,
    _check_out DATE,
    _exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if room is blocked during the period
    IF EXISTS (
        SELECT 1 FROM public.rooms
        WHERE id = _room_id
        AND is_blocked = true
        AND (blocked_until IS NULL OR blocked_until >= _check_in)
    ) THEN
        RETURN false;
    END IF;

    -- Check for overlapping bookings
    RETURN NOT EXISTS (
        SELECT 1 FROM public.room_bookings
        WHERE room_id = _room_id
        AND status NOT IN ('cancelled', 'checked_out')
        AND id IS DISTINCT FROM _exclude_booking_id
        AND (
            (check_in_date < _check_out AND check_out_date > _check_in)
        )
    );
END;
$$;

-- Create trigger to validate booking before insert/update
CREATE OR REPLACE FUNCTION public.validate_room_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validate dates
    IF NEW.check_out_date <= NEW.check_in_date THEN
        RAISE EXCEPTION 'Check-out date must be after check-in date';
    END IF;

    -- Check availability
    IF NOT check_room_availability(
        NEW.room_id, 
        NEW.check_in_date, 
        NEW.check_out_date,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
    ) THEN
        RAISE EXCEPTION 'Room is not available for selected dates';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_booking_before_insert
BEFORE INSERT ON public.room_bookings
FOR EACH ROW
EXECUTE FUNCTION public.validate_room_booking();

CREATE TRIGGER validate_booking_before_update
BEFORE UPDATE ON public.room_bookings
FOR EACH ROW
WHEN (OLD.check_in_date IS DISTINCT FROM NEW.check_in_date 
   OR OLD.check_out_date IS DISTINCT FROM NEW.check_out_date
   OR OLD.room_id IS DISTINCT FROM NEW.room_id)
EXECUTE FUNCTION public.validate_room_booking();

-- Enable RLS
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for room_types
CREATE POLICY "Anyone can view active room types"
ON public.room_types
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage room types"
ON public.room_types
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for rooms
CREATE POLICY "Anyone can view active rooms"
ON public.rooms
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage rooms"
ON public.rooms
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for room_bookings
CREATE POLICY "Users can view their own bookings"
ON public.room_bookings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
ON public.room_bookings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Verified users can create bookings"
ON public.room_bookings
FOR INSERT
WITH CHECK (is_verified(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can update their pending bookings"
ON public.room_bookings
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending'::booking_status);

CREATE POLICY "Admins can update all bookings"
ON public.room_bookings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at triggers
CREATE TRIGGER update_room_types_updated_at
BEFORE UPDATE ON public.room_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_bookings_updated_at
BEFORE UPDATE ON public.room_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default room types (Dharamshala + Guest Houses)
INSERT INTO public.room_types (name, type, description, capacity, price_per_night, amenities) VALUES
('Dharamshala Dormitory', 'dormitory', 'Shared dormitory with basic amenities for devotees', 8, 100.00, ARRAY['Shared Bathroom', 'Fan', 'Bedding']),
('Standard Non-AC Room', 'non_ac', 'Private room with basic amenities', 2, 500.00, ARRAY['Private Bathroom', 'Fan', 'TV', 'Bedding']),
('Standard AC Room', 'ac', 'Private air-conditioned room', 2, 800.00, ARRAY['Private Bathroom', 'AC', 'TV', 'Bedding', 'Hot Water']),
('Deluxe AC Room', 'deluxe', 'Spacious air-conditioned room with premium amenities', 3, 1200.00, ARRAY['Private Bathroom', 'AC', 'TV', 'Bedding', 'Hot Water', 'Mini Fridge', 'Balcony']);

-- Create accommodation locations table
CREATE TABLE public.accommodation_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.accommodation_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active locations" ON public.accommodation_locations
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage locations" ON public.accommodation_locations
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add new columns to rooms table for location-based allocation
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.accommodation_locations(id),
  ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS ac_type TEXT DEFAULT 'non_ac',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

-- Create room allocations table
CREATE TABLE public.room_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  allocated_by UUID,
  check_in_date DATE,
  check_out_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_room_allocations_active_room ON public.room_allocations (room_id) WHERE status = 'active';

ALTER TABLE public.room_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage allocations" ON public.room_allocations
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Volunteers can view allocations" ON public.room_allocations
FOR SELECT USING (has_role(auth.uid(), 'volunteer'::app_role));

CREATE POLICY "Users can view own allocations" ON public.room_allocations
FOR SELECT USING (auth.uid() = user_id);

-- Create user notifications table
CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.user_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON public.user_notifications
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger: auto-update room status when allocation changes
CREATE OR REPLACE FUNCTION public.update_room_on_allocation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.rooms SET status = 'occupied' WHERE id = NEW.room_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('cancelled', 'swapped') AND OLD.status = 'active' THEN
      UPDATE public.rooms SET status = 'available' WHERE id = NEW.room_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.rooms SET status = 'available' WHERE id = OLD.room_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_room_allocation_change
AFTER INSERT OR UPDATE OR DELETE ON public.room_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_room_on_allocation();

-- Trigger: auto-create notification when room is assigned
CREATE OR REPLACE FUNCTION public.notify_room_allocation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _room_number TEXT;
  _location_name TEXT;
BEGIN
  SELECT r.room_number, al.name INTO _room_number, _location_name
  FROM public.rooms r
  LEFT JOIN public.accommodation_locations al ON r.location_id = al.id
  WHERE r.id = NEW.room_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    INSERT INTO public.user_notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      'Room Assigned',
      'You have been assigned Room ' || COALESCE(_room_number, 'N/A') || ' at ' || COALESCE(_location_name, 'Event Venue') || '.',
      'room_assigned',
      jsonb_build_object('room_id', NEW.room_id, 'allocation_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_room_allocation_notify
AFTER INSERT OR UPDATE ON public.room_allocations
FOR EACH ROW
EXECUTE FUNCTION public.notify_room_allocation();

-- Updated_at triggers
CREATE TRIGGER update_accommodation_locations_updated_at
BEFORE UPDATE ON public.accommodation_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_allocations_updated_at
BEFORE UPDATE ON public.room_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

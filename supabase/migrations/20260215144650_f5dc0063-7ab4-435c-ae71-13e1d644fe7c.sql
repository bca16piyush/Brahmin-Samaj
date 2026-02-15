
-- Create a function to check allocation date overlaps for a room
CREATE OR REPLACE FUNCTION public.check_allocation_availability(
  _room_id uuid,
  _check_in date,
  _check_out date,
  _exclude_allocation_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate dates
  IF _check_out <= _check_in THEN
    RETURN false;
  END IF;

  -- Check for overlapping active allocations
  RETURN NOT EXISTS (
    SELECT 1 FROM public.room_allocations
    WHERE room_id = _room_id
    AND status = 'active'
    AND id IS DISTINCT FROM _exclude_allocation_id
    AND (
      (check_in_date < _check_out AND check_out_date > _check_in)
    )
  );
END;
$$;

-- Create a validation trigger to prevent overlapping allocations
CREATE OR REPLACE FUNCTION public.validate_room_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only validate active allocations with dates
  IF NEW.status = 'active' AND NEW.check_in_date IS NOT NULL AND NEW.check_out_date IS NOT NULL THEN
    -- Validate dates
    IF NEW.check_out_date <= NEW.check_in_date THEN
      RAISE EXCEPTION 'Check-out date must be after check-in date';
    END IF;

    -- Check for overlapping allocations
    IF NOT check_allocation_availability(
      NEW.room_id,
      NEW.check_in_date,
      NEW.check_out_date,
      CASE WHEN TG_OP = 'UPDATE' THEN OLD.id ELSE NULL END
    ) THEN
      RAISE EXCEPTION 'Room is already allocated for the selected dates';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach the trigger
CREATE TRIGGER validate_room_allocation_trigger
BEFORE INSERT OR UPDATE ON public.room_allocations
FOR EACH ROW
EXECUTE FUNCTION public.validate_room_allocation();

-- Update the room status trigger to be date-aware
-- A room is "occupied" only if it has an active allocation covering TODAY
CREATE OR REPLACE FUNCTION public.update_room_on_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _has_active boolean;
BEGIN
  -- After any allocation change, recalculate room status based on current active allocations
  IF TG_OP = 'DELETE' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.room_allocations
      WHERE room_id = OLD.room_id
      AND status = 'active'
      AND (check_in_date IS NULL OR check_in_date <= CURRENT_DATE)
      AND (check_out_date IS NULL OR check_out_date > CURRENT_DATE)
    ) INTO _has_active;
    
    UPDATE public.rooms SET status = CASE WHEN _has_active THEN 'occupied' ELSE 'available' END
    WHERE id = OLD.room_id;
    
    RETURN OLD;
  ELSE
    -- For INSERT/UPDATE, update both old and new room
    IF TG_OP = 'UPDATE' AND OLD.room_id IS DISTINCT FROM NEW.room_id THEN
      -- Update old room
      SELECT EXISTS (
        SELECT 1 FROM public.room_allocations
        WHERE room_id = OLD.room_id
        AND status = 'active'
        AND (check_in_date IS NULL OR check_in_date <= CURRENT_DATE)
        AND (check_out_date IS NULL OR check_out_date > CURRENT_DATE)
      ) INTO _has_active;
      UPDATE public.rooms SET status = CASE WHEN _has_active THEN 'occupied' ELSE 'available' END
      WHERE id = OLD.room_id;
    END IF;
    
    -- Update new/current room
    SELECT EXISTS (
      SELECT 1 FROM public.room_allocations
      WHERE room_id = NEW.room_id
      AND status = 'active'
      AND (check_in_date IS NULL OR check_in_date <= CURRENT_DATE)
      AND (check_out_date IS NULL OR check_out_date > CURRENT_DATE)
    ) INTO _has_active;
    UPDATE public.rooms SET status = CASE WHEN _has_active THEN 'occupied' ELSE 'available' END
    WHERE id = NEW.room_id;
    
    RETURN NEW;
  END IF;
END;
$$;

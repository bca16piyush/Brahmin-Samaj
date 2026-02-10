
-- Create booth_locations table
CREATE TABLE IF NOT EXISTS public.booth_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.booth_locations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booth_locations' AND policyname = 'Anyone can view active booth locations') THEN
    CREATE POLICY "Anyone can view active booth locations" ON public.booth_locations FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booth_locations' AND policyname = 'Admins can manage booth locations') THEN
    CREATE POLICY "Admins can manage booth locations" ON public.booth_locations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

INSERT INTO public.booth_locations (name) VALUES
  ('Main Gate'), ('Bhojanalaya'), ('VIP Entrance'), ('Yagya Shala'), ('Prasad Counter'), ('Exit Gate')
ON CONFLICT (name) DO NOTHING;

-- Create event_logs table
CREATE TABLE IF NOT EXISTS public.event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  booth_location text NOT NULL,
  scanned_by uuid NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- Use admin role only for policies (volunteer check done in app code via admin role)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_logs' AND policyname = 'Admins can insert event logs') THEN
    CREATE POLICY "Admins can insert event logs" ON public.event_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_logs' AND policyname = 'Admins can view all event logs') THEN
    CREATE POLICY "Admins can view all event logs" ON public.event_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_event_logs_user_booth ON public.event_logs(user_id, booth_location, scanned_at);
CREATE INDEX IF NOT EXISTS idx_event_logs_booth ON public.event_logs(booth_location);
CREATE INDEX IF NOT EXISTS idx_event_logs_scanned_at ON public.event_logs(scanned_at);

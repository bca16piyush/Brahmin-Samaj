-- Create event_registrations table
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered',
  attended BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Verified users can register for events"
ON public.event_registrations
FOR INSERT
WITH CHECK (is_verified(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can view their own registrations"
ON public.event_registrations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
ON public.event_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can cancel their own registrations"
ON public.event_registrations
FOR DELETE
USING (auth.uid() = user_id AND status = 'registered');

CREATE POLICY "Admins can update registrations"
ON public.event_registrations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_event_registrations_updated_at
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create table for past event live videos
CREATE TABLE public.past_event_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_name TEXT,
  event_date DATE,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.past_event_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view published past event videos"
ON public.past_event_videos
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage past event videos"
ON public.past_event_videos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add video support to gallery table
ALTER TABLE public.gallery 
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add trigger for updated_at
CREATE TRIGGER update_past_event_videos_updated_at
BEFORE UPDATE ON public.past_event_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add to realtime if needed
ALTER PUBLICATION supabase_realtime ADD TABLE public.past_event_videos;
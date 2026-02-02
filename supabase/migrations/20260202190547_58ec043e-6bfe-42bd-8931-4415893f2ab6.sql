-- Create scheduled WhatsApp messages table
CREATE TABLE public.scheduled_whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message_template TEXT NOT NULL,
    recipients JSONB NOT NULL,
    media_url TEXT,
    media_type TEXT,
    additional_media JSONB DEFAULT '[]'::jsonb,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    delay_ms INTEGER DEFAULT 5000,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    executed_at TIMESTAMP WITH TIME ZONE,
    result JSONB,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.scheduled_whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Only admins can manage scheduled messages
CREATE POLICY "Admins can manage scheduled messages"
ON public.scheduled_whatsapp_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient querying of pending scheduled messages
CREATE INDEX idx_scheduled_whatsapp_pending ON public.scheduled_whatsapp_messages(scheduled_at) WHERE status = 'pending';
-- Create admin audit log table for tracking sensitive operations
CREATE TABLE public.admin_audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_resource_type ON public.admin_audit_logs(resource_type);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (read-only for accountability)
CREATE POLICY "Admins can view all audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only service role can insert (edge functions use service role)
CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (true);

-- Create rate limiting table
CREATE TABLE public.rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    request_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, action, window_start)
);

-- Create index for rate limit lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(user_id, action, window_start);

-- Enable RLS - only service role should access this
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role policy for rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    _user_id UUID,
    _action TEXT,
    _max_requests INTEGER DEFAULT 10,
    _window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _window_start TIMESTAMP WITH TIME ZONE;
    _current_count INTEGER;
BEGIN
    -- Calculate window start (truncated to minute)
    _window_start := date_trunc('minute', now());
    
    -- Try to insert or update the rate limit record
    INSERT INTO public.rate_limits (user_id, action, window_start, request_count)
    VALUES (_user_id, _action, _window_start, 1)
    ON CONFLICT (user_id, action, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO _current_count;
    
    -- Clean up old rate limit records (older than 1 hour)
    DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 hour';
    
    -- Return true if within limit
    RETURN _current_count <= _max_requests;
END;
$$;
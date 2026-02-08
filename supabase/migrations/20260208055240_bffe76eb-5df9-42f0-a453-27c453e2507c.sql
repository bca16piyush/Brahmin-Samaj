-- Insert quick_live_stream config entry if it doesn't exist
INSERT INTO public.site_config (config_key, config_value)
VALUES ('quick_live_stream', '{"youtube_url": "", "title": "Live Stream", "enabled": false}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;
-- Create admin permission types enum
CREATE TYPE public.admin_permission AS ENUM (
  'overview',
  'verifications', 
  'users',
  'pandits',
  'bookings',
  'donations',
  'events',
  'registrations',
  'news',
  'gallery',
  'past_videos',
  'rooms',
  'inventory',
  'bulk_whatsapp',
  'security',
  'audit_logs',
  'site_settings',
  'team'
);

-- Create admin_permissions table for granular access
CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions admin_permission[] NOT NULL DEFAULT '{}',
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Create site_config table for CMS settings
CREATE TABLE public.site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default homepage button config
INSERT INTO public.site_config (config_key, config_value) VALUES 
('homepage_cta_button', '{"text": "About Guruji", "url": "/about", "enabled": true}');

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = _user_id AND is_super_admin = true
  )
$$;

-- Security definer function to check specific permission
CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id UUID, _permission admin_permission)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = _user_id 
    AND (is_super_admin = true OR _permission = ANY(permissions))
  )
$$;

-- RLS policies for admin_permissions
CREATE POLICY "Super admins can manage all permissions"
ON public.admin_permissions FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Admins can view own permissions"
ON public.admin_permissions FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS policies for site_config
CREATE POLICY "Anyone can read site config"
ON public.site_config FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage site config"
ON public.site_config FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Grant existing admins super admin status initially
INSERT INTO public.admin_permissions (user_id, is_super_admin, permissions)
SELECT ur.user_id, true, ARRAY['overview', 'verifications', 'users', 'pandits', 'bookings', 
  'donations', 'events', 'registrations', 'news', 'gallery', 'past_videos', 'rooms', 
  'inventory', 'bulk_whatsapp', 'security', 'audit_logs', 'site_settings', 'team']::admin_permission[]
FROM public.user_roles ur
WHERE ur.role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_admin_permissions_updated_at
BEFORE UPDATE ON public.admin_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_config_updated_at
BEFORE UPDATE ON public.site_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
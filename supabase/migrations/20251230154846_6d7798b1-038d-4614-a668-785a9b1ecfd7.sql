-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create verification_status enum
CREATE TYPE public.verification_status AS ENUM ('none', 'pending', 'verified', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  gotra TEXT,
  father_name TEXT,
  native_village TEXT,
  reference_person TEXT,
  reference_mobile TEXT,
  verification_status public.verification_status DEFAULT 'none',
  rejection_reason TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create pandits table
CREATE TABLE public.pandits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  expertise TEXT[] DEFAULT '{}',
  location TEXT,
  phone TEXT,
  whatsapp TEXT,
  availability TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  image_url TEXT,
  youtube_live_url TEXT,
  is_live BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monetary_donations table
CREATE TABLE public.monetary_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  transaction_id TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create in_kind_donations table
CREATE TABLE public.in_kind_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  item_type TEXT NOT NULL,
  quantity TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  status TEXT DEFAULT 'pledged',
  notes TEXT,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create news table
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT false,
  send_notification BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gallery table
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id),
  event_name TEXT,
  event_date DATE,
  category TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_subscriptions table for push notifications
CREATE TABLE public.notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_number TEXT,
  push_subscription JSONB,
  email_notifications BOOLEAN DEFAULT true,
  whatsapp_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pandits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monetary_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_kind_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create has_role function for checking admin privileges (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create is_verified function
CREATE OR REPLACE FUNCTION public.is_verified(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND verification_status = 'verified'
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Pandits RLS policies (public read, admin write)
CREATE POLICY "Anyone can view active pandits"
  ON public.pandits FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pandits"
  ON public.pandits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Events RLS policies
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Monetary donations RLS policies
CREATE POLICY "Users can view their own donations"
  ON public.monetary_donations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Verified users can create donations"
  ON public.monetary_donations FOR INSERT
  WITH CHECK (public.is_verified(auth.uid()));

CREATE POLICY "Admins can view all donations"
  ON public.monetary_donations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update donations"
  ON public.monetary_donations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- In-kind donations RLS policies
CREATE POLICY "Users can view their own in-kind donations"
  ON public.in_kind_donations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Verified users can create in-kind donations"
  ON public.in_kind_donations FOR INSERT
  WITH CHECK (public.is_verified(auth.uid()));

CREATE POLICY "Admins can view all in-kind donations"
  ON public.in_kind_donations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update in-kind donations"
  ON public.in_kind_donations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- News RLS policies
CREATE POLICY "Anyone can view news"
  ON public.news FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage news"
  ON public.news FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Gallery RLS policies
CREATE POLICY "Anyone can view public gallery"
  ON public.gallery FOR SELECT
  USING (is_public = true);

CREATE POLICY "Verified users can view all gallery"
  ON public.gallery FOR SELECT
  USING (public.is_verified(auth.uid()));

CREATE POLICY "Admins can manage gallery"
  ON public.gallery FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Notification subscriptions RLS policies
CREATE POLICY "Users can manage their own subscriptions"
  ON public.notification_subscriptions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.notification_subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, mobile, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'mobile', ''),
    NEW.email
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pandits_updated_at
  BEFORE UPDATE ON public.pandits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for verification documents (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

-- Create storage bucket for gallery images (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Create storage bucket for pandit photos (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('pandit-photos', 'pandit-photos', true);

-- Storage policies for verification docs (only admins can view)
CREATE POLICY "Users can upload their own verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Only admins can view verification docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-docs' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for gallery
CREATE POLICY "Anyone can view gallery images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "Admins can upload gallery images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete gallery images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for pandit photos
CREATE POLICY "Anyone can view pandit photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pandit-photos');

CREATE POLICY "Admins can manage pandit photos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'pandit-photos' AND public.has_role(auth.uid(), 'admin'));
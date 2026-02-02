-- Create storage bucket for room type images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('room-images', 'room-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view room images (public bucket)
CREATE POLICY "Anyone can view room images"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

-- Allow admins to upload room images
CREATE POLICY "Admins can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update room images
CREATE POLICY "Admins can update room images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'room-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete room images
CREATE POLICY "Admins can delete room images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'room-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);
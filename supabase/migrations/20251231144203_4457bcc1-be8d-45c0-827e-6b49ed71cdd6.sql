-- Add return_images column to orders table
ALTER TABLE public.orders 
ADD COLUMN return_images text[] DEFAULT NULL;

-- Create storage bucket for return images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('return-images', 'return-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload return images
CREATE POLICY "Authenticated users can upload return images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'return-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to return images
CREATE POLICY "Public can view return images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'return-images');

-- Allow authenticated users to delete their own return images
CREATE POLICY "Users can delete their own return images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'return-images' AND auth.uid()::text = (storage.foldername(name))[1]);
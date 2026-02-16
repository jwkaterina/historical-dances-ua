-- Create storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to images bucket
CREATE POLICY "Public Read Images" ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Public Upload Images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() IS NOT NULL);

CREATE POLICY "Authenticated Delete Images" ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

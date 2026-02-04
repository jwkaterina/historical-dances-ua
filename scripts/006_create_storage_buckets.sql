-- Create storage buckets for audio and video uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('audio', 'audio', true),
  ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable public access to audio bucket
CREATE POLICY "Public Read Audio" ON storage.objects FOR SELECT
  USING (bucket_id = 'audio');

CREATE POLICY "Public Upload Audio" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio' AND auth.role() IS NOT NULL);

-- Enable public access to videos bucket
CREATE POLICY "Public Read Videos" ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

CREATE POLICY "Public Upload Videos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.role() IS NOT NULL);

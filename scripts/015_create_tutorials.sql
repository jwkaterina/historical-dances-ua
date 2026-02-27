-- Create tutorials table
CREATE TABLE IF NOT EXISTS tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_de TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'pdf')),
  video_type TEXT CHECK (video_type IN ('youtube', 'uploaded')),
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view tutorials"
  ON tutorials FOR SELECT TO public USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert tutorials"
  ON tutorials FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update tutorials"
  ON tutorials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete tutorials"
  ON tutorials FOR DELETE TO authenticated USING (true);

-- Create a storage bucket for documents (PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: public read for documents
CREATE POLICY "Public read access for documents"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'documents');

-- Storage policy: authenticated upload for documents
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Storage policy: authenticated delete for documents
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents');

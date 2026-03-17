-- =============================================
-- FRESH SETUP: Run this instead of individual
-- migration scripts for a new Supabase project.
-- =============================================

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "public_read_music" ON music;
DROP POLICY IF EXISTS "Public read music" ON music;
DROP POLICY IF EXISTS "public_insert_music" ON music;
DROP POLICY IF EXISTS "public_update_music" ON music;
DROP POLICY IF EXISTS "public_delete_music" ON music;
DROP POLICY IF EXISTS "Authenticated can insert music" ON music;
DROP POLICY IF EXISTS "Authenticated can update music" ON music;
DROP POLICY IF EXISTS "Authenticated can delete music" ON music;

DROP POLICY IF EXISTS "public_read_dances" ON dances;
DROP POLICY IF EXISTS "Public read dances" ON dances;
DROP POLICY IF EXISTS "Authenticated can insert dances" ON dances;
DROP POLICY IF EXISTS "Authenticated can update dances" ON dances;
DROP POLICY IF EXISTS "Authenticated can delete dances" ON dances;

DROP POLICY IF EXISTS "public_read_dance_music" ON dance_music;
DROP POLICY IF EXISTS "Public read dance_music" ON dance_music;
DROP POLICY IF EXISTS "Authenticated can insert dance_music" ON dance_music;
DROP POLICY IF EXISTS "Authenticated can update dance_music" ON dance_music;
DROP POLICY IF EXISTS "Authenticated can delete dance_music" ON dance_music;

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  tempo INTEGER,
  genre TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  name_ua TEXT,
  name_ru TEXT,
  description TEXT,
  description_ua TEXT,
  description_ru TEXT,
  scheme TEXT,
  scheme_ua TEXT,
  scheme_ru TEXT,
  difficulty TEXT,
  origin TEXT,
  youtube_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dance_music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  music_id UUID NOT NULL REFERENCES music(id) ON DELETE CASCADE,
  UNIQUE(dance_id, music_id)
);

CREATE TABLE IF NOT EXISTS balls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ua TEXT,
  name_ru TEXT,
  date DATE NOT NULL,
  place TEXT NOT NULL,
  place_ua TEXT,
  place_ru TEXT,
  info_text TEXT,
  info_ua TEXT,
  info_ru TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ball_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ball_id UUID NOT NULL REFERENCES balls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ua TEXT,
  name_ru TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS section_dances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES ball_sections(id) ON DELETE CASCADE,
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  music_ids TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  order_index INTEGER DEFAULT 0,
  UNIQUE(section_id, dance_id)
);

CREATE TABLE IF NOT EXISTS section_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES ball_sections(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  content_ua TEXT NOT NULL,
  content_ru TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dance_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'uploaded')),
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dance_figures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  scheme_ua TEXT,
  scheme_ru TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS figure_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id UUID NOT NULL REFERENCES dance_figures(id) ON DELETE CASCADE,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'uploaded')),
  url TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tutorial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ua TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ua TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'image')),
  video_type TEXT CHECK (video_type IN ('youtube', 'uploaded')),
  url TEXT NOT NULL,
  category_id UUID REFERENCES tutorial_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dance_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dance_id, tutorial_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_dance_videos_dance_id ON dance_videos(dance_id);
CREATE INDEX IF NOT EXISTS idx_dance_figures_dance_id ON dance_figures(dance_id);
CREATE INDEX IF NOT EXISTS idx_figure_videos_figure_id ON figure_videos(figure_id);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE dances ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE balls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ball_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_dances ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_figures ENABLE ROW LEVEL SECURITY;
ALTER TABLE figure_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_tutorials ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Music
CREATE POLICY "Public read music" ON music FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert music" ON music FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update music" ON music FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete music" ON music FOR DELETE USING (auth.role() = 'authenticated');

-- Dances
CREATE POLICY "Public read dances" ON dances FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert dances" ON dances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update dances" ON dances FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete dances" ON dances FOR DELETE USING (auth.role() = 'authenticated');

-- Dance music
CREATE POLICY "Public read dance_music" ON dance_music FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert dance_music" ON dance_music FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update dance_music" ON dance_music FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete dance_music" ON dance_music FOR DELETE USING (auth.role() = 'authenticated');

-- Balls
CREATE POLICY "Public read balls" ON balls FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert balls" ON balls FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update balls" ON balls FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete balls" ON balls FOR DELETE USING (auth.role() = 'authenticated');

-- Ball sections
CREATE POLICY "Public read ball_sections" ON ball_sections FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert ball_sections" ON ball_sections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update ball_sections" ON ball_sections FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete ball_sections" ON ball_sections FOR DELETE USING (auth.role() = 'authenticated');

-- Section dances
CREATE POLICY "Public read section_dances" ON section_dances FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert section_dances" ON section_dances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update section_dances" ON section_dances FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete section_dances" ON section_dances FOR DELETE USING (auth.role() = 'authenticated');

-- Section texts
CREATE POLICY "Public read section_texts" ON section_texts FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert section_texts" ON section_texts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update section_texts" ON section_texts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete section_texts" ON section_texts FOR DELETE USING (auth.role() = 'authenticated');

-- Dance videos
CREATE POLICY "Anyone can view dance videos" ON dance_videos FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert dance videos" ON dance_videos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update dance videos" ON dance_videos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete dance videos" ON dance_videos FOR DELETE TO authenticated USING (true);

-- Dance figures
CREATE POLICY "Anyone can view dance figures" ON dance_figures FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert dance figures" ON dance_figures FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update dance figures" ON dance_figures FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete dance figures" ON dance_figures FOR DELETE TO authenticated USING (true);

-- Figure videos
CREATE POLICY "Anyone can view figure videos" ON figure_videos FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert figure videos" ON figure_videos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update figure videos" ON figure_videos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete figure videos" ON figure_videos FOR DELETE TO authenticated USING (true);

-- Tutorials
CREATE POLICY "Anyone can view tutorials" ON tutorials FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert tutorials" ON tutorials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tutorials" ON tutorials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete tutorials" ON tutorials FOR DELETE TO authenticated USING (true);

-- Tutorial categories
CREATE POLICY "Anyone can view tutorial categories" ON tutorial_categories FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert tutorial categories" ON tutorial_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tutorial categories" ON tutorial_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete tutorial categories" ON tutorial_categories FOR DELETE TO authenticated USING (true);

-- Dance tutorials
CREATE POLICY "Public can read dance_tutorials" ON dance_tutorials FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage dance_tutorials" ON dance_tutorials FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('audio', 'audio', true),
  ('videos', 'videos', true),
  ('images', 'images', true),
  ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Audio" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Audio" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

CREATE POLICY "Public Read Audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio');
CREATE POLICY "Public Upload Audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.role() IS NOT NULL);

CREATE POLICY "Public Read Videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Public Upload Videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() IS NOT NULL);

CREATE POLICY "Public Read Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Public Upload Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() IS NOT NULL);
CREATE POLICY "Authenticated Delete Images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Public read access for documents" ON storage.objects FOR SELECT TO public USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Authenticated users can delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- =============================================
-- FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION delete_orphaned_music()
RETURNS void AS $$
BEGIN
  DELETE FROM music
  WHERE id NOT IN (
    SELECT DISTINCT music_id FROM dance_music
  );
END;
$$ LANGUAGE plpgsql;

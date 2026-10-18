-- =============================================
-- 026: Host the UA site inside the taenze project
--
-- Run this in the SQL editor of the *taenze* Supabase project (the German
-- site's project), not in the old UA project.
--
-- Everything the UA site stores goes into its own `ua` schema and its own
-- `ua-*` storage buckets, so it never mixes with the German site's tables in
-- `public` or its `audio`/`videos`/`images`/`documents` buckets.
-- Logins (auth.users) are shared: one account works on both sites, and each
-- site keeps its own profiles/roles.
--
-- After running it: Project Settings -> Data API -> Exposed schemas, add `ua`.
-- Safe to run more than once.
-- =============================================

CREATE SCHEMA IF NOT EXISTS ua;

GRANT USAGE ON SCHEMA ua TO anon, authenticated, service_role;

-- =============================================
-- TABLES (same shape as the old UA project's public schema)
-- =============================================

CREATE TABLE IF NOT EXISTS ua.music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  url TEXT,
  audio_url TEXT,
  tempo INTEGER,
  genre TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ua.dances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS ua.dance_music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES ua.dances(id) ON DELETE CASCADE,
  music_id UUID NOT NULL REFERENCES ua.music(id) ON DELETE CASCADE,
  UNIQUE(dance_id, music_id)
);

CREATE TABLE IF NOT EXISTS ua.balls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ua TEXT,
  name_ru TEXT,
  date DATE NOT NULL,
  place TEXT NOT NULL,
  place_ua TEXT,
  place_ru TEXT,
  info_text TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ua.ball_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ball_id UUID NOT NULL REFERENCES ua.balls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ua TEXT,
  name_ru TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ua.section_dances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES ua.ball_sections(id) ON DELETE CASCADE,
  dance_id UUID NOT NULL REFERENCES ua.dances(id) ON DELETE CASCADE,
  music_ids TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  order_index INTEGER DEFAULT 0,
  UNIQUE(section_id, dance_id)
);

CREATE TABLE IF NOT EXISTS ua.section_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES ua.ball_sections(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  content_ua TEXT NOT NULL,
  content_ru TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ua.dance_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES ua.dances(id) ON DELETE CASCADE,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'uploaded')),
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ua.dance_figures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES ua.dances(id) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  scheme_ua TEXT,
  scheme_ru TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ua.figure_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id UUID NOT NULL REFERENCES ua.dance_figures(id) ON DELETE CASCADE,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'uploaded')),
  url TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ua.tutorial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ua TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ua.tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ua TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'image')),
  video_type TEXT CHECK (video_type IN ('youtube', 'uploaded')),
  url TEXT NOT NULL,
  category_id UUID REFERENCES ua.tutorial_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ua.dance_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES ua.dances(id) ON DELETE CASCADE,
  tutorial_id UUID NOT NULL REFERENCES ua.tutorials(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dance_id, tutorial_id)
);

CREATE TABLE IF NOT EXISTS ua.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS ua.user_dance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dance_id UUID NOT NULL REFERENCES ua.dances(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  list_type TEXT CHECK (list_type IN ('already_learned', 'learning', 'plan_to_learn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, dance_id)
);

CREATE TABLE IF NOT EXISTS ua.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_ua TEXT NOT NULL,
  question_ru TEXT NOT NULL,
  answer_ua TEXT NOT NULL,
  answer_ru TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dance_videos_dance_id ON ua.dance_videos(dance_id);
CREATE INDEX IF NOT EXISTS idx_dance_figures_dance_id ON ua.dance_figures(dance_id);
CREATE INDEX IF NOT EXISTS idx_figure_videos_figure_id ON ua.figure_videos(figure_id);
CREATE INDEX IF NOT EXISTS idx_user_dance_status_user_id ON ua.user_dance_status(user_id);

GRANT ALL ON ALL TABLES IN SCHEMA ua TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA ua TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ua TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ua GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ua GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ua GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- =============================================
-- ROW LEVEL SECURITY (same rules as the old UA project)
-- =============================================

DO $$
DECLARE t TEXT;
BEGIN
  -- Content tables: anyone reads, signed-in users write.
  FOREACH t IN ARRAY ARRAY[
    'music', 'dances', 'dance_music', 'balls', 'ball_sections', 'section_dances',
    'section_texts', 'dance_videos', 'dance_figures', 'figure_videos',
    'tutorial_categories', 'tutorials', 'dance_tutorials', 'faqs'
  ] LOOP
    EXECUTE format('ALTER TABLE ua.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "public_read" ON ua.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_insert" ON ua.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_update" ON ua.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_delete" ON ua.%I', t);
    EXECUTE format('CREATE POLICY "public_read" ON ua.%I FOR SELECT USING (true)', t);
    EXECUTE format('CREATE POLICY "authenticated_insert" ON ua.%I FOR INSERT TO authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "authenticated_update" ON ua.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "authenticated_delete" ON ua.%I FOR DELETE TO authenticated USING (true)', t);
  END LOOP;
END $$;

-- Profiles: public read, writes only through the service role.
ALTER TABLE ua.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON ua.profiles;
CREATE POLICY "Public read profiles" ON ua.profiles FOR SELECT USING (true);

-- Favourites and learning lists: anyone reads, users write only their own.
ALTER TABLE ua.user_dance_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_dance_status_select" ON ua.user_dance_status;
DROP POLICY IF EXISTS "user_dance_status_insert" ON ua.user_dance_status;
DROP POLICY IF EXISTS "user_dance_status_update" ON ua.user_dance_status;
DROP POLICY IF EXISTS "user_dance_status_delete" ON ua.user_dance_status;
CREATE POLICY "user_dance_status_select" ON ua.user_dance_status FOR SELECT USING (true);
CREATE POLICY "user_dance_status_insert" ON ua.user_dance_status
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_dance_status_update" ON ua.user_dance_status
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_dance_status_delete" ON ua.user_dance_status
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION ua.delete_orphaned_music()
RETURNS void AS $$
BEGIN
  DELETE FROM ua.music
  WHERE id NOT IN (SELECT DISTINCT music_id FROM ua.dance_music);
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Every new login gets a UA profile too. This runs next to the German site's
-- own on_auth_user_created trigger; it must never block a sign-up, so any
-- error is swallowed.
CREATE OR REPLACE FUNCTION ua.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO ua.profiles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'user')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'ua.handle_new_user failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created_ua ON auth.users;
CREATE TRIGGER on_auth_user_created_ua
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ua.handle_new_user();

-- Existing logins get a UA profile; the two UA admins keep their role.
INSERT INTO ua.profiles (user_id, email, role)
SELECT id, email,
  CASE WHEN lower(email) IN ('jwkaterina@gmail.com', 'genesisnata@gmail.com') THEN 'admin' ELSE 'user' END
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- STORAGE: separate public buckets for the UA site
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('ua-audio', 'ua-audio', true),
  ('ua-videos', 'ua-videos', true),
  ('ua-images', 'ua-images', true),
  ('ua-documents', 'ua-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Uploads go through signed URLs issued with the service role key
-- (app/api/upload), so no extra storage.objects policies are needed.

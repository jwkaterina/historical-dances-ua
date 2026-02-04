CREATE TABLE IF NOT EXISTS music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  tempo INTEGER,
  genre TEXT,
  spotify_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scheme TEXT,
  difficulty TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dance_music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID REFERENCES dances(id) ON DELETE CASCADE,
  music_id UUID REFERENCES music(id) ON DELETE CASCADE,
  UNIQUE(dance_id, music_id)
);

ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE dances ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_music ENABLE ROW LEVEL SECURITY;

-- Music policies
CREATE POLICY "Public read music" ON music FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert music" ON music FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update music" ON music FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete music" ON music FOR DELETE USING (auth.role() = 'authenticated');

-- Dances policies
CREATE POLICY "Public read dances" ON dances FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert dances" ON dances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update dances" ON dances FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete dances" ON dances FOR DELETE USING (auth.role() = 'authenticated');

-- Dance music policies
CREATE POLICY "Public read dance_music" ON dance_music FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert dance_music" ON dance_music FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update dance_music" ON dance_music FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete dance_music" ON dance_music FOR DELETE USING (auth.role() = 'authenticated');

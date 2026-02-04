-- Create music table
CREATE TABLE IF NOT EXISTS music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dances table
CREATE TABLE IF NOT EXISTS dances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  scheme TEXT,
  difficulty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for dance-music relationship
CREATE TABLE IF NOT EXISTS dance_music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  music_id UUID NOT NULL REFERENCES music(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE dances ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_music ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_music" ON music FOR SELECT USING (true);
CREATE POLICY "public_read_dances" ON dances FOR SELECT USING (true);
CREATE POLICY "public_read_dance_music" ON dance_music FOR SELECT USING (true);

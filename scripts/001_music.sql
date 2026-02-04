CREATE TABLE IF NOT EXISTS music (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE music ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_music" ON music FOR SELECT USING (true);
CREATE POLICY "public_insert_music" ON music FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_music" ON music FOR UPDATE USING (true);
CREATE POLICY "public_delete_music" ON music FOR DELETE USING (true);

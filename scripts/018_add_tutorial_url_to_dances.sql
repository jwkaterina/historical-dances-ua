-- Create junction table linking dances to tutorials
CREATE TABLE IF NOT EXISTS dance_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dance_id, tutorial_id)
);

ALTER TABLE dance_tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read dance_tutorials"
  ON dance_tutorials FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage dance_tutorials"
  ON dance_tutorials FOR ALL USING (auth.role() = 'authenticated');

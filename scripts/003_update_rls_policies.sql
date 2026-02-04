-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read music" ON music;
DROP POLICY IF EXISTS "Authenticated can insert music" ON music;
DROP POLICY IF EXISTS "Authenticated can update music" ON music;
DROP POLICY IF EXISTS "Authenticated can delete music" ON music;

DROP POLICY IF EXISTS "Public read dances" ON dances;
DROP POLICY IF EXISTS "Authenticated can insert dances" ON dances;
DROP POLICY IF EXISTS "Authenticated can update dances" ON dances;
DROP POLICY IF EXISTS "Authenticated can delete dances" ON dances;

DROP POLICY IF EXISTS "Public read dance_music" ON dance_music;
DROP POLICY IF EXISTS "Authenticated can insert dance_music" ON dance_music;
DROP POLICY IF EXISTS "Authenticated can update dance_music" ON dance_music;
DROP POLICY IF EXISTS "Authenticated can delete dance_music" ON dance_music;

-- Ensure RLS is enabled
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

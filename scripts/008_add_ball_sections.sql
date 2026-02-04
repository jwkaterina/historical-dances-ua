-- Add columns to balls table for localized names
ALTER TABLE balls ADD COLUMN IF NOT EXISTS ball_sections UUID;

-- Create ball_sections table
CREATE TABLE IF NOT EXISTS ball_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ball_id UUID NOT NULL REFERENCES balls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_de TEXT,
  name_ru TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create section_dances junction table (replaces direct ball_dances)
CREATE TABLE IF NOT EXISTS section_dances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES ball_sections(id) ON DELETE CASCADE,
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(section_id, dance_id)
);

-- Enable RLS
ALTER TABLE ball_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_dances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ball_sections
CREATE POLICY "Public read ball_sections" ON ball_sections FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert ball_sections" ON ball_sections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update ball_sections" ON ball_sections FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete ball_sections" ON ball_sections FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for section_dances
CREATE POLICY "Public read section_dances" ON section_dances FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert section_dances" ON section_dances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update section_dances" ON section_dances FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete section_dances" ON section_dances FOR DELETE USING (auth.role() = 'authenticated');

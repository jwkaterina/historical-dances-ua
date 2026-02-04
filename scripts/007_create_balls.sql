-- Create balls table
CREATE TABLE IF NOT EXISTS balls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_de TEXT,
  name_ru TEXT,
  date DATE NOT NULL,
  place TEXT NOT NULL,
  place_de TEXT,
  place_ru TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ball_dances junction table
CREATE TABLE IF NOT EXISTS ball_dances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ball_id UUID NOT NULL REFERENCES balls(id) ON DELETE CASCADE,
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  UNIQUE(ball_id, dance_id)
);

-- Enable RLS
ALTER TABLE balls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ball_dances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for balls
CREATE POLICY "Public read balls" ON balls FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert balls" ON balls FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update balls" ON balls FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete balls" ON balls FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for ball_dances
CREATE POLICY "Public read ball_dances" ON ball_dances FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert ball_dances" ON ball_dances FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update ball_dances" ON ball_dances FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete ball_dances" ON ball_dances FOR DELETE USING (auth.role() = 'authenticated');

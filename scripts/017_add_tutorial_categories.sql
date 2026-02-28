-- Create tutorial categories table
CREATE TABLE IF NOT EXISTS tutorial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tutorial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tutorial categories"
  ON tutorial_categories FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can insert tutorial categories"
  ON tutorial_categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tutorial categories"
  ON tutorial_categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tutorial categories"
  ON tutorial_categories FOR DELETE TO authenticated USING (true);

-- Add category_id to tutorials
ALTER TABLE tutorials
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES tutorial_categories(id) ON DELETE SET NULL;

-- Add translation columns to dances table
ALTER TABLE dances ADD COLUMN IF NOT EXISTS name_de TEXT;
ALTER TABLE dances ADD COLUMN IF NOT EXISTS name_ru TEXT;
ALTER TABLE dances ADD COLUMN IF NOT EXISTS description_de TEXT;
ALTER TABLE dances ADD COLUMN IF NOT EXISTS description_ru TEXT;
ALTER TABLE dances ADD COLUMN IF NOT EXISTS scheme_de TEXT;
ALTER TABLE dances ADD COLUMN IF NOT EXISTS scheme_ru TEXT;

-- Add translation columns to music table
ALTER TABLE music ADD COLUMN IF NOT EXISTS title_de TEXT;
ALTER TABLE music ADD COLUMN IF NOT EXISTS title_ru TEXT;

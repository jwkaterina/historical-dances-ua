-- Add audio_url column to music table if it doesn't exist
ALTER TABLE music ADD COLUMN IF NOT EXISTS audio_url TEXT;

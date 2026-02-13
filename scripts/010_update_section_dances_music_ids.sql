-- Create music_ids array column and migrate from legacy music_id, then drop legacy column
BEGIN;

-- Add music_ids column as text[]; change to uuid[] if your music IDs are UUIDs
ALTER TABLE section_dances
  ADD COLUMN IF NOT EXISTS music_ids text[] DEFAULT '{}'::text[] NOT NULL;

-- Backfill from legacy music_id if present
UPDATE section_dances
SET music_ids = ARRAY[music_id]::text[]
WHERE music_id IS NOT NULL
  AND (music_ids IS NULL OR music_ids = '{}'::text[]);

-- Drop legacy column if no longer needed
ALTER TABLE section_dances
  DROP COLUMN IF EXISTS music_id;

COMMIT;

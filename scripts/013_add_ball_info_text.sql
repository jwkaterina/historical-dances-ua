-- Add info_text column to balls table for rich text content
ALTER TABLE balls ADD COLUMN IF NOT EXISTS info_text TEXT;
ALTER TABLE balls ADD COLUMN info_de TEXT;
ALTER TABLE balls ADD COLUMN info_ru TEXT;

/* Copy existing info_text into both new columns (optional) */
UPDATE balls
SET info_de = info_text,
    info_ru = info_text
WHERE info_text IS NOT NULL;

/* Optionally drop the old column once verified:
ALTER TABLE balls DROP COLUMN info_text;
*/
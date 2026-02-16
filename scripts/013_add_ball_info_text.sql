-- Add info_text column to balls table for rich text content
ALTER TABLE balls ADD COLUMN IF NOT EXISTS info_text TEXT;

-- Allow 'image' as a tutorial type
ALTER TABLE tutorials DROP CONSTRAINT IF EXISTS tutorials_type_check;
ALTER TABLE tutorials ADD CONSTRAINT tutorials_type_check
  CHECK (type IN ('video', 'pdf', 'image'));

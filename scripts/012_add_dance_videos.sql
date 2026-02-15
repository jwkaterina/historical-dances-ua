-- Migration: Add dance_videos table for multiple videos per dance
-- This replaces the single youtube_url and video_url columns in the dances table

-- Create dance_videos table
CREATE TABLE IF NOT EXISTS dance_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'uploaded')),
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by dance_id
CREATE INDEX IF NOT EXISTS idx_dance_videos_dance_id ON dance_videos(dance_id);

-- Migrate existing data from dances table
-- Insert YouTube URLs with order_index 0
INSERT INTO dance_videos (dance_id, video_type, url, order_index)
SELECT
  id as dance_id,
  'youtube' as video_type,
  youtube_url as url,
  0 as order_index
FROM dances
WHERE youtube_url IS NOT NULL AND youtube_url != '';

-- Insert uploaded video URLs with order_index 1 (or 0 if no YouTube URL exists)
INSERT INTO dance_videos (dance_id, video_type, url, order_index)
SELECT
  d.id as dance_id,
  'uploaded' as video_type,
  d.video_url as url,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM dance_videos dv
      WHERE dv.dance_id = d.id AND dv.video_type = 'youtube'
    ) THEN 1
    ELSE 0
  END as order_index
FROM dances d
WHERE d.video_url IS NOT NULL AND d.video_url != '';

-- RLS Policies
ALTER TABLE dance_videos ENABLE ROW LEVEL SECURITY;

-- Public can view all videos
CREATE POLICY "Anyone can view dance videos"
  ON dance_videos
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert videos
CREATE POLICY "Authenticated users can insert dance videos"
  ON dance_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update videos
CREATE POLICY "Authenticated users can update dance videos"
  ON dance_videos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete videos
CREATE POLICY "Authenticated users can delete dance videos"
  ON dance_videos
  FOR DELETE
  TO authenticated
  USING (true);

-- Note: Keep youtube_url and video_url columns in dances table for now
-- They can be dropped in a future migration after verifying everything works

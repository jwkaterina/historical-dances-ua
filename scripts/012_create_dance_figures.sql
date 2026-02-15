BEGIN;

CREATE TABLE IF NOT EXISTS dance_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dance_id uuid NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  scheme_de text,
  scheme_ru text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS figure_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  figure_id uuid NOT NULL REFERENCES dance_figures(id) ON DELETE CASCADE,
  video_type text NOT NULL CHECK (video_type IN ('youtube','uploaded')),
  url text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_dance_figures_dance_id ON dance_figures(dance_id);
CREATE INDEX IF NOT EXISTS idx_figure_videos_figure_id ON figure_videos(figure_id);

-- Enable RLS on dance_figures
ALTER TABLE dance_figures ENABLE ROW LEVEL SECURITY;

-- Public can view all figures
CREATE POLICY "Anyone can view dance figures"
  ON dance_figures
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert figures
CREATE POLICY "Authenticated users can insert dance figures"
  ON dance_figures
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update figures
CREATE POLICY "Authenticated users can update dance figures"
  ON dance_figures
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete figures
CREATE POLICY "Authenticated users can delete dance figures"
  ON dance_figures
  FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on figure_videos
ALTER TABLE figure_videos ENABLE ROW LEVEL SECURITY;

-- Public can view all figure videos
CREATE POLICY "Anyone can view figure videos"
  ON figure_videos
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert figure videos
CREATE POLICY "Authenticated users can insert figure videos"
  ON figure_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update figure videos
CREATE POLICY "Authenticated users can update figure videos"
  ON figure_videos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete figure videos
CREATE POLICY "Authenticated users can delete figure videos"
  ON figure_videos
  FOR DELETE
  TO authenticated
  USING (true);

COMMIT;

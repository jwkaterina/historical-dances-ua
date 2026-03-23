-- Create user_dance_status table for favorites and learning lists
CREATE TABLE user_dance_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dance_id UUID NOT NULL REFERENCES dances(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT false,
  list_type TEXT CHECK (list_type IN ('already_learned', 'learning', 'plan_to_learn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, dance_id)
);

-- RLS policies
ALTER TABLE user_dance_status ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "user_dance_status_select" ON user_dance_status
  FOR SELECT USING (true);

-- Authenticated users can insert their own statuses
CREATE POLICY "user_dance_status_insert" ON user_dance_status
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own statuses
CREATE POLICY "user_dance_status_update" ON user_dance_status
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own statuses
CREATE POLICY "user_dance_status_delete" ON user_dance_status
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookups by user
CREATE INDEX idx_user_dance_status_user_id ON user_dance_status(user_id);

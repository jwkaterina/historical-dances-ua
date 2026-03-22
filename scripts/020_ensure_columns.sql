-- =============================================
-- Ensure all required columns exist.
-- Safe to run multiple times.
-- =============================================

DO $$
BEGIN
  -- dances
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='difficulty') THEN
    ALTER TABLE dances ADD COLUMN difficulty TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='origin') THEN
    ALTER TABLE dances ADD COLUMN origin TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='youtube_url') THEN
    ALTER TABLE dances ADD COLUMN youtube_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='video_url') THEN
    ALTER TABLE dances ADD COLUMN video_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='description') THEN
    ALTER TABLE dances ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='scheme') THEN
    ALTER TABLE dances ADD COLUMN scheme TEXT;
  END IF;

  -- balls
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='date') THEN
    ALTER TABLE balls ADD COLUMN date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='place') THEN
    ALTER TABLE balls ADD COLUMN place TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='user_id') THEN
    ALTER TABLE balls ADD COLUMN user_id UUID;
  END IF;

  -- music
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='music' AND column_name='audio_url') THEN
    ALTER TABLE music ADD COLUMN audio_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='music' AND column_name='tempo') THEN
    ALTER TABLE music ADD COLUMN tempo INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='music' AND column_name='genre') THEN
    ALTER TABLE music ADD COLUMN genre TEXT;
  END IF;

  -- dance_figures
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dance_figures' AND column_name='order_index') THEN
    ALTER TABLE dance_figures ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dance_figures' AND column_name='scheme_ru') THEN
    ALTER TABLE dance_figures ADD COLUMN scheme_ru TEXT;
  END IF;

  -- section_dances
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='section_dances' AND column_name='music_ids') THEN
    ALTER TABLE section_dances ADD COLUMN music_ids UUID[] DEFAULT '{}';
  END IF;
END $$;

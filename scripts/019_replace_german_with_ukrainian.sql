-- =============================================
-- Migration: Add _ua and _ru language columns
-- Safe: skips columns that already exist.
-- =============================================

DO $$
BEGIN
  -- dances
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='name_de') THEN
    ALTER TABLE dances RENAME COLUMN name_de TO name_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='name_ua') THEN
    ALTER TABLE dances ADD COLUMN name_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='name_ru') THEN
    ALTER TABLE dances ADD COLUMN name_ru TEXT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='description_de') THEN
    ALTER TABLE dances RENAME COLUMN description_de TO description_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='description_ua') THEN
    ALTER TABLE dances ADD COLUMN description_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='description_ru') THEN
    ALTER TABLE dances ADD COLUMN description_ru TEXT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='scheme_de') THEN
    ALTER TABLE dances RENAME COLUMN scheme_de TO scheme_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='scheme_ua') THEN
    ALTER TABLE dances ADD COLUMN scheme_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dances' AND column_name='scheme_ru') THEN
    ALTER TABLE dances ADD COLUMN scheme_ru TEXT;
  END IF;

  -- balls
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='name_de') THEN
    ALTER TABLE balls RENAME COLUMN name_de TO name_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='name_ua') THEN
    ALTER TABLE balls ADD COLUMN name_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='name_ru') THEN
    ALTER TABLE balls ADD COLUMN name_ru TEXT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='place_de') THEN
    ALTER TABLE balls RENAME COLUMN place_de TO place_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='place_ua') THEN
    ALTER TABLE balls ADD COLUMN place_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='place_ru') THEN
    ALTER TABLE balls ADD COLUMN place_ru TEXT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='info_de') THEN
    ALTER TABLE balls RENAME COLUMN info_de TO info_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='info_ua') THEN
    ALTER TABLE balls ADD COLUMN info_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='balls' AND column_name='info_ru') THEN
    ALTER TABLE balls ADD COLUMN info_ru TEXT;
  END IF;

  -- ball_sections
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ball_sections' AND column_name='name_de') THEN
    ALTER TABLE ball_sections RENAME COLUMN name_de TO name_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ball_sections' AND column_name='name_ua') THEN
    ALTER TABLE ball_sections ADD COLUMN name_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ball_sections' AND column_name='name_ru') THEN
    ALTER TABLE ball_sections ADD COLUMN name_ru TEXT;
  END IF;

  -- section_texts
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='section_texts' AND column_name='content_de') THEN
    ALTER TABLE section_texts RENAME COLUMN content_de TO content_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='section_texts' AND column_name='content_ua') THEN
    ALTER TABLE section_texts ADD COLUMN content_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='section_texts' AND column_name='content_ru') THEN
    ALTER TABLE section_texts ADD COLUMN content_ru TEXT;
  END IF;

  -- dance_figures
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dance_figures' AND column_name='scheme_de') THEN
    ALTER TABLE dance_figures RENAME COLUMN scheme_de TO scheme_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dance_figures' AND column_name='scheme_ua') THEN
    ALTER TABLE dance_figures ADD COLUMN scheme_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dance_figures' AND column_name='scheme_ru') THEN
    ALTER TABLE dance_figures ADD COLUMN scheme_ru TEXT;
  END IF;

  -- tutorials
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutorials' AND column_name='title_de') THEN
    ALTER TABLE tutorials RENAME COLUMN title_de TO title_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutorials' AND column_name='title_ua') THEN
    ALTER TABLE tutorials ADD COLUMN title_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutorials' AND column_name='title_ru') THEN
    ALTER TABLE tutorials ADD COLUMN title_ru TEXT;
  END IF;

  -- tutorial_categories
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutorial_categories' AND column_name='name_de') THEN
    ALTER TABLE tutorial_categories RENAME COLUMN name_de TO name_ua;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutorial_categories' AND column_name='name_ua') THEN
    ALTER TABLE tutorial_categories ADD COLUMN name_ua TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutorial_categories' AND column_name='name_ru') THEN
    ALTER TABLE tutorial_categories ADD COLUMN name_ru TEXT;
  END IF;
END $$;

-- Remove ball info columns (content moved to FAQs page)
ALTER TABLE balls DROP COLUMN IF EXISTS info_ua;
ALTER TABLE balls DROP COLUMN IF EXISTS info_ru;

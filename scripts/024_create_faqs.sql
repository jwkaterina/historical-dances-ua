-- Create FAQs table
CREATE TABLE faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_ua TEXT NOT NULL,
  question_ru TEXT NOT NULL,
  answer_ua TEXT NOT NULL,
  answer_ru TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "faqs_select" ON faqs
  FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "faqs_insert" ON faqs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "faqs_update" ON faqs
  FOR UPDATE TO authenticated
  USING (true);

-- Authenticated users can delete
CREATE POLICY "faqs_delete" ON faqs
  FOR DELETE TO authenticated
  USING (true);

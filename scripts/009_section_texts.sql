CREATE TABLE section_texts (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               section_id UUID NOT NULL REFERENCES ball_sections(id) ON DELETE CASCADE,
                               order_index INT NOT NULL,
                               content TEXT NOT NULL
);
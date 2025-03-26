-- Altera a coluna metabase_embed_code para metabase_question_id
ALTER TABLE ambassadors 
  RENAME COLUMN metabase_embed_code TO metabase_question_id;

-- Altera o tipo da coluna para INTEGER
ALTER TABLE ambassadors 
  ALTER COLUMN metabase_question_id TYPE INTEGER USING metabase_question_id::INTEGER; 
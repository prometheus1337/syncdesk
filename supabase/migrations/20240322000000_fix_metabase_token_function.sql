-- Remove a função antiga que aceita INTEGER
DROP FUNCTION IF EXISTS generate_metabase_token(INTEGER);

-- Mantém apenas a função que aceita TEXT
CREATE OR REPLACE FUNCTION generate_metabase_token(question_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload JSONB;
  token TEXT;
  embed_url TEXT;
BEGIN
  -- Cria o payload do token
  payload := jsonb_build_object(
    'resource', jsonb_build_object('question', question_id),
    'params', '{}',
    'exp', extract(epoch from now() + interval '10 minutes')
  );

  -- Gera o token JWT usando a chave secreta do Metabase
  token := pgcrypto.sign(
    payload::text,
    current_setting('app.metabase_secret_key'),
    'HS256'
  );

  -- Constrói a URL completa do iframe
  embed_url := current_setting('app.metabase_site_url') || 
                '/embed/question/' || token;

  RETURN embed_url;
END;
$$; 
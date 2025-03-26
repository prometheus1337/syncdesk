-- Remove a função antiga que aceita INTEGER
DROP FUNCTION IF EXISTS generate_metabase_token(INTEGER);

-- Mantém apenas a função que aceita TEXT
CREATE OR REPLACE FUNCTION generate_metabase_token(question_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  header TEXT;
  payload TEXT;
  signature TEXT;
  token TEXT;
  embed_url TEXT;
BEGIN
  -- Cria o header do token (base64)
  header := encode(
    convert_to('{"alg":"HS256","typ":"JWT"}', 'UTF8'),
    'base64'
  );

  -- Cria o payload do token (base64)
  payload := encode(
    convert_to(
      json_build_object(
        'resource', json_build_object('question', question_id),
        'params', '{}',
        'exp', extract(epoch from now() + interval '10 minutes')
      )::text,
      'UTF8'
    ),
    'base64'
  );

  -- Gera a assinatura usando HMAC-SHA256
  signature := encode(
    hmac(
      header || '.' || payload,
      current_setting('app.metabase_secret_key'),
      'sha256'
    ),
    'base64'
  );

  -- Constrói o token JWT
  token := header || '.' || payload || '.' || signature;

  -- Constrói a URL completa do iframe
  embed_url := current_setting('app.metabase_site_url') || 
                '/embed/question/' || token;

  RETURN embed_url;
END;
$$; 
-- Função para gerar o token do Metabase
CREATE OR REPLACE FUNCTION generate_metabase_token(question_id INTEGER)
RETURNS TEXT AS $$
DECLARE
  metabase_site_url TEXT := 'https://metabase.syncdesk.app';
  metabase_secret_key TEXT := 'e26e8e79b35729f74310c13119f281929aa8a04be6084ab193fe7c998c9afd69';
  payload JSONB;
  token TEXT;
BEGIN
  payload := jsonb_build_object(
    'resource', jsonb_build_object('question', question_id),
    'params', '{}'::jsonb,
    'exp', extract(epoch from now()) + 600
  );
  
  token := pgcrypto.sign(
    payload::text,
    decode(metabase_secret_key, 'hex'),
    'HS256'
  );
  
  RETURN metabase_site_url || '/embed/question/' || token || '#bordered=true&titled=true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
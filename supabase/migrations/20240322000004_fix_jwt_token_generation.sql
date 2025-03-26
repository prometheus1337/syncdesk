-- Atualiza a função generate_metabase_token para gerar o token corretamente
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
  secret_key TEXT;
BEGIN
  -- Obtém a chave secreta
  secret_key := get_metabase_config('metabase_secret_key');
  
  -- Cria o header do token (base64url)
  header := rtrim(replace(encode(convert_to('{"alg":"HS256","typ":"JWT"}', 'UTF8'), 'base64'), '=', ''), '/+');

  -- Cria o payload do token (base64url)
  payload := rtrim(replace(encode(
    convert_to(
      json_build_object(
        'resource', json_build_object('question', question_id),
        'params', '{}',
        'exp', extract(epoch from now() + interval '10 minutes')::bigint
      )::text,
      'UTF8'
    ),
    'base64'
  ), '=', ''), '/+');

  -- Gera a assinatura usando HMAC-SHA256 (base64url)
  signature := rtrim(replace(encode(
    hmac(
      header || '.' || payload,
      secret_key,
      'sha256'
    ),
    'base64'
  ), '=', ''), '/+');

  -- Constrói o token JWT
  token := header || '.' || payload || '.' || signature;

  -- Constrói a URL completa do iframe
  embed_url := get_metabase_config('metabase_site_url') || 
                '/embed/question/' || token;

  RETURN embed_url;
END;
$$; 
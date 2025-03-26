-- Cria a extensão para gerenciar configurações personalizadas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Cria uma tabela para armazenar as configurações do Metabase
CREATE TABLE IF NOT EXISTS metabase_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insere as configurações do Metabase
INSERT INTO metabase_config (key, value) VALUES
    ('metabase_site_url', 'https://metabase.syncdesk.com.br'),
    ('metabase_secret_key', 'your-secret-key-here')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Cria uma função para obter as configurações
CREATE OR REPLACE FUNCTION get_metabase_config(config_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT value FROM metabase_config WHERE key = config_key);
END;
$$;

-- Atualiza a função generate_metabase_token para usar a nova função
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
      get_metabase_config('metabase_secret_key'),
      'sha256'
    ),
    'base64'
  );

  -- Constrói o token JWT
  token := header || '.' || payload || '.' || signature;

  -- Constrói a URL completa do iframe
  embed_url := get_metabase_config('metabase_site_url') || 
                '/embed/question/' || token;

  RETURN embed_url;
END;
$$; 
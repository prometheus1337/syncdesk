-- Adiciona o cargo 'ambassador' como uma opção válida
ALTER TABLE app_users
DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users
ADD CONSTRAINT app_users_role_check
CHECK (role IN ('admin', 'user', 'cs', 'ambassador', 'support', 'commercial', 'essay_director', 'designer'));

-- Atualiza a view para incluir o novo cargo
CREATE OR REPLACE VIEW users_view AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users;

-- Atualiza a função create-user para aceitar o cargo de embaixador
CREATE OR REPLACE FUNCTION create_user(
  email TEXT,
  password TEXT,
  role TEXT,
  name TEXT
) RETURNS json AS $$
DECLARE
  new_user json;
  user_id uuid;
BEGIN
  -- Valida o cargo
  IF role NOT IN ('admin', 'user', 'cs', 'ambassador', 'support', 'commercial', 'essay_director', 'designer') THEN
    RAISE EXCEPTION 'Cargo inválido: %', role;
  END IF;

  -- Cria o usuário no auth.users
  new_user := supabase_auth.create_user(
    email := email,
    password := password,
    email_confirm := true,
    user_metadata := json_build_object(
      'full_name', name,
      'role', role
    )
  );

  user_id := (new_user->>'id')::uuid;

  -- Insere o usuário na tabela app_users
  INSERT INTO app_users (id, email, full_name, role)
  VALUES (user_id, email, name, role::user_role);

  RETURN new_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
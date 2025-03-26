-- Cria uma view para acessar os usuários de forma segura
CREATE OR REPLACE VIEW public.users_view AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users;

-- Garante que o schema public está acessível
GRANT USAGE ON SCHEMA public TO authenticated;

-- Permite acesso à view apenas para usuários autenticados
GRANT SELECT ON public.users_view TO authenticated;

-- Cria uma política de segurança para a view
CREATE POLICY "Usuários autenticados podem ver a view de usuários"
    ON public.users_view
    FOR SELECT
    TO authenticated
    USING (true); 
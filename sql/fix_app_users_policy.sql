-- Remover a política antiga
DROP POLICY IF EXISTS "Apenas admins podem inserir usuários" ON public.app_users;

-- Criar nova política que permite a inserção durante a criação do usuário
CREATE POLICY "Permitir inserção de usuários"
    ON public.app_users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);  -- Permite qualquer inserção autenticada

-- Atualizar a política de atualização para garantir que apenas admins podem modificar
DROP POLICY IF EXISTS "Apenas admins podem atualizar usuários" ON public.app_users;
CREATE POLICY "Apenas admins podem atualizar usuários"
    ON public.app_users
    FOR UPDATE
    TO authenticated
    USING (is_admin()); 
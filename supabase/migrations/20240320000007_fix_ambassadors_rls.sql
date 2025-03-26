-- Remove políticas existentes
DROP POLICY IF EXISTS "Admins podem inserir embaixadores" ON ambassadors;
DROP POLICY IF EXISTS "Admins podem ver todos os embaixadores" ON ambassadors;
DROP POLICY IF EXISTS "Embaixadores podem ver seus próprios dados" ON ambassadors;

-- Habilita RLS na tabela ambassadors
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;

-- Política para permitir admins inserirem embaixadores
CREATE POLICY "Admins podem inserir embaixadores" ON ambassadors
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Política para permitir admins verem todos os embaixadores
CREATE POLICY "Admins podem ver todos os embaixadores" ON ambassadors
FOR SELECT
TO authenticated
USING (is_admin());

-- Política para permitir embaixadores verem seus próprios dados
CREATE POLICY "Embaixadores podem ver seus próprios dados" ON ambassadors
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_view
    WHERE users_view.id = auth.uid()
    AND users_view.role = 'ambassador'
    AND ambassadors.user_id = auth.uid()
  )
);

-- Política para permitir admins atualizarem embaixadores
CREATE POLICY "Admins podem atualizar embaixadores" ON ambassadors
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Política para permitir admins deletarem embaixadores
CREATE POLICY "Admins podem deletar embaixadores" ON ambassadors
FOR DELETE
TO authenticated
USING (is_admin()); 
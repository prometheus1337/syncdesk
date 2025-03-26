-- Cria a tabela de embaixadores
CREATE TABLE IF NOT EXISTS ambassadors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    metabase_embed_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cria um índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_ambassadors_user_id ON ambassadors(user_id);

-- Cria uma política de segurança para permitir apenas usuários autenticados verem os embaixadores
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver embaixadores"
    ON ambassadors FOR SELECT
    TO authenticated
    USING (true);

-- Cria uma política para permitir apenas admins criarem/editaram embaixadores
CREATE POLICY "Apenas admins podem gerenciar embaixadores"
    ON ambassadors FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Cria uma política para permitir embaixadores verem seus próprios dados
CREATE POLICY "Embaixadores podem ver seus próprios dados"
    ON ambassadors FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id); 
-- Políticas de segurança para permitir uploads anônimos no bucket de armazenamento
-- Estas políticas permitem que usuários não autenticados e autenticados façam upload de arquivos

-- Verificar se o bucket existe e criar se não existir
DO $$
BEGIN
    -- Verificar se o bucket existe
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'doc_media'
    ) THEN
        -- Criar o bucket se não existir
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('doc_media', 'doc_media', true);
        
        RAISE NOTICE 'Bucket doc_media criado com sucesso!';
    ELSE
        RAISE NOTICE 'Bucket doc_media já existe!';
    END IF;
END $$;

-- Remover políticas existentes para evitar duplicação
DROP POLICY IF EXISTS "Permitir uploads anônimos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir visualização anônima" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização anônima" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão anônima" ON storage.objects;

-- Política para permitir INSERT (upload) para usuários anônimos e autenticados no bucket doc_media
CREATE POLICY "Permitir uploads anônimos" 
ON storage.objects 
FOR INSERT 
TO anon, authenticated
WITH CHECK (bucket_id = 'doc_media');

-- Política para permitir SELECT (download/visualização) para usuários anônimos e autenticados no bucket doc_media
CREATE POLICY "Permitir visualização anônima" 
ON storage.objects 
FOR SELECT 
TO anon, authenticated
USING (bucket_id = 'doc_media');

-- Política para permitir UPDATE para usuários anônimos e autenticados no bucket doc_media (necessário para upsert)
CREATE POLICY "Permitir atualização anônima" 
ON storage.objects 
FOR UPDATE 
TO anon, authenticated
USING (bucket_id = 'doc_media');

-- Política para permitir DELETE para usuários anônimos e autenticados no bucket doc_media
CREATE POLICY "Permitir exclusão anônima" 
ON storage.objects 
FOR DELETE 
TO anon, authenticated
USING (bucket_id = 'doc_media');

-- Verificar se as políticas foram aplicadas
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname IN (
        'Permitir uploads anônimos',
        'Permitir visualização anônima',
        'Permitir atualização anônima',
        'Permitir exclusão anônima'
    );
    
    IF policy_count = 4 THEN
        RAISE NOTICE 'Todas as 4 políticas de armazenamento foram aplicadas com sucesso!';
    ELSE
        RAISE NOTICE 'Atenção: Apenas % de 4 políticas foram aplicadas. Verifique se há erros.', policy_count;
    END IF;
    
    RAISE NOTICE 'Agora usuários anônimos e autenticados podem fazer upload, visualizar, atualizar e excluir arquivos no bucket doc_media.';
    RAISE NOTICE 'Para testar, reinicie a aplicação e tente fazer upload de um arquivo.';
END $$; 
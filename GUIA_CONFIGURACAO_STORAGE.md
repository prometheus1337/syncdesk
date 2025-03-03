# Guia de Configuração do Storage no Supabase

Este guia explica como configurar corretamente o bucket de armazenamento `doc_media` no Supabase para permitir uploads de arquivos.

## 1. Acessar o Painel do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.io)
2. Selecione seu projeto

## 2. Criar o Bucket de Armazenamento

1. No menu lateral, clique em **Storage**
2. Clique no botão **Create new bucket**
3. Digite `doc_media` como nome do bucket
4. Marque a opção **Public bucket** (para permitir acesso público aos arquivos)
5. Clique em **Create bucket**

## 3. Configurar Políticas de Acesso

### Método 1: Usando o SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Crie uma nova query
3. Cole o seguinte código SQL:

```sql
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
```

4. Clique em **Run** para executar o SQL

### Método 2: Usando a Interface Gráfica

1. No menu lateral, clique em **Storage**
2. Selecione o bucket `doc_media`
3. Clique na aba **Policies**
4. Clique em **New Policy**
5. Selecione **For full customization**
6. Configure cada política:

   **Política de Upload (INSERT):**
   - Policy name: `Permitir uploads anônimos`
   - Allowed operation: `INSERT`
   - Target roles: `anon, authenticated`
   - WITH CHECK expression: `bucket_id = 'doc_media'`

   **Política de Visualização (SELECT):**
   - Policy name: `Permitir visualização anônima`
   - Allowed operation: `SELECT`
   - Target roles: `anon, authenticated`
   - USING expression: `bucket_id = 'doc_media'`

   **Política de Atualização (UPDATE):**
   - Policy name: `Permitir atualização anônima`
   - Allowed operation: `UPDATE`
   - Target roles: `anon, authenticated`
   - USING expression: `bucket_id = 'doc_media'`

   **Política de Exclusão (DELETE):**
   - Policy name: `Permitir exclusão anônima`
   - Allowed operation: `DELETE`
   - Target roles: `anon, authenticated`
   - USING expression: `bucket_id = 'doc_media'`

## 4. Verificar a Configuração

1. No menu lateral, clique em **Storage**
2. Selecione o bucket `doc_media`
3. Clique na aba **Policies**
4. Verifique se todas as políticas estão listadas e ativas

## 5. Testar o Upload

Após configurar o bucket e as políticas, reinicie a aplicação e tente fazer upload de um arquivo novamente. O sistema deve agora fazer o upload para o Supabase em vez de usar imagens de placeholder.

## Solução de Problemas

Se ainda estiver enfrentando problemas:

1. **Verifique as Credenciais:** Certifique-se de que as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas corretamente no arquivo `.env` ou `.env.local`.

2. **Verifique o Console:** Abra o console do navegador (F12) e verifique se há mensagens de erro detalhadas que possam ajudar a identificar o problema.

3. **Verifique o RLS:** Certifique-se de que o RLS (Row Level Security) está habilitado para a tabela `storage.objects` e que as políticas estão configuradas corretamente.

4. **Verifique o CORS:** Se estiver tendo problemas de CORS, verifique as configurações de CORS no Supabase.

5. **Reinicie o Servidor:** Às vezes, reiniciar o servidor de desenvolvimento pode resolver problemas de cache. 
# Painel de Reembolsos e Chargebacks

Sistema interno para monitoramento de reembolsos e chargebacks.

## Configuração

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Crie um arquivo `.env` na raiz do projeto
- Adicione suas credenciais do Supabase:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura do Banco de Dados (Supabase)

Crie uma tabela `refunds` com a seguinte estrutura:

- id: int8 (primary key)
- created_at: timestamp with time zone
- customer_name: text
- amount: numeric
- type: text (enum: 'refund', 'chargeback')
- status: text (enum: 'pending', 'approved', 'rejected')

## Instruções para Atualização do Banco de Dados

### Alterações Necessárias

1. **Renomear a tabela `refunds` para `data`**:
   ```sql
   CREATE TABLE public.data (
       id BIGSERIAL PRIMARY KEY,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
       customer_name TEXT NOT NULL,
       amount NUMERIC NOT NULL,
       type TEXT NOT NULL CHECK (type IN ('refund', 'chargeback')),
       status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
       access_revoked BOOLEAN DEFAULT FALSE NOT NULL,
       created_by UUID REFERENCES public.app_users(id),
       updated_by UUID REFERENCES public.app_users(id)
   );
   ```

2. **Atualizar as políticas RLS**:
   ```sql
   -- Habilitar RLS na tabela
   ALTER TABLE public.data ENABLE ROW LEVEL SECURITY;

   -- Políticas para data (reembolsos e chargebacks)
   CREATE POLICY "Admins e suporte podem ver reembolsos"
   ON public.data
   FOR SELECT
   TO authenticated
   USING (can_access_refunds());

   CREATE POLICY "Admins e suporte podem inserir reembolsos"
   ON public.data
   FOR INSERT
   TO authenticated
   WITH CHECK (can_access_refunds());

   CREATE POLICY "Admins e suporte podem atualizar reembolsos"
   ON public.data
   FOR UPDATE
   TO authenticated
   USING (can_access_refunds());

   CREATE POLICY "Apenas admins podem deletar reembolsos"
   ON public.data
   FOR DELETE
   TO authenticated
   USING (is_admin());
   ```

### Passos para Atualização Manual

1. Acesse o painel do Supabase
2. Vá para a seção "SQL Editor"
3. Execute os seguintes comandos:

```sql
-- Remover objetos existentes
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.app_users;
DROP POLICY IF EXISTS "Apenas admins podem inserir usuários" ON public.app_users;
DROP POLICY IF EXISTS "Apenas admins podem atualizar usuários" ON public.app_users;
DROP POLICY IF EXISTS "Apenas admins podem deletar usuários" ON public.app_users;
DROP POLICY IF EXISTS "Admins e suporte podem ver reembolsos" ON public.data;
DROP POLICY IF EXISTS "Admins e suporte podem inserir reembolsos" ON public.data;
DROP POLICY IF EXISTS "Admins e suporte podem atualizar reembolsos" ON public.data;
DROP POLICY IF EXISTS "Apenas admins podem deletar reembolsos" ON public.data;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_access_refunds(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_initial_admin(TEXT, TEXT, TEXT) CASCADE;

DROP TABLE IF EXISTS public.data CASCADE;
DROP TABLE IF EXISTS public.app_users CASCADE;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        DROP TYPE user_role CASCADE;
    END IF;
END $$;

-- Criar tipo enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'support', 'commercial');

-- Criar tabela de usuários do app
CREATE TABLE public.app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'commercial',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar tabela de dados (reembolsos e chargebacks)
CREATE TABLE public.data (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    customer_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('refund', 'chargeback')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    access_revoked BOOLEAN DEFAULT FALSE NOT NULL,
    created_by UUID REFERENCES public.app_users(id),
    updated_by UUID REFERENCES public.app_users(id)
);

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela app_users
CREATE TRIGGER update_app_users_updated_at
    BEFORE UPDATE ON public.app_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS nas tabelas
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.app_users
        WHERE id = auth.uid() AND role = 'admin'::user_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se o usuário tem acesso aos reembolsos
CREATE OR REPLACE FUNCTION can_access_refunds()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.app_users
        WHERE id = auth.uid() AND (role = 'admin'::user_role OR role = 'support'::user_role)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para app_users
CREATE POLICY "Permitir leitura para usuários autenticados"
    ON public.app_users
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Apenas admins podem inserir usuários"
    ON public.app_users
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Apenas admins podem atualizar usuários"
    ON public.app_users
    FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Apenas admins podem deletar usuários"
    ON public.app_users
    FOR DELETE
    TO authenticated
    USING (is_admin());

-- Políticas para data (reembolsos e chargebacks)
CREATE POLICY "Admins e suporte podem ver reembolsos"
    ON public.data
    FOR SELECT
    TO authenticated
    USING (can_access_refunds());

CREATE POLICY "Admins e suporte podem inserir reembolsos"
    ON public.data
    FOR INSERT
    TO authenticated
    WITH CHECK (can_access_refunds());

CREATE POLICY "Admins e suporte podem atualizar reembolsos"
    ON public.data
    FOR UPDATE
    TO authenticated
    USING (can_access_refunds());

CREATE POLICY "Apenas admins podem deletar reembolsos"
    ON public.data
    FOR DELETE
    TO authenticated
    USING (is_admin());

-- Função para criar o primeiro usuário admin
CREATE OR REPLACE FUNCTION create_initial_admin(
    admin_email TEXT,
    admin_password TEXT,
    admin_full_name TEXT
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Criar usuário no auth.users
    user_id := (
        SELECT id FROM auth.users
        WHERE email = admin_email
        LIMIT 1
    );
    
    IF user_id IS NULL THEN
        INSERT INTO auth.users (email, password, email_confirmed_at)
        VALUES (admin_email, admin_password, NOW())
        RETURNING id INTO user_id;
    END IF;

    -- Criar entrada na app_users
    INSERT INTO public.app_users (id, email, full_name, role)
    VALUES (user_id, admin_email, admin_full_name, 'admin')
    ON CONFLICT (id) DO NOTHING;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Copiar dados da tabela refunds para data (se existirem)
INSERT INTO public.data (id, created_at, customer_name, amount, type, status, created_by, updated_by)
SELECT id, created_at, customer_name, amount, type, status, created_by, updated_by
FROM public.refunds;

-- Remover a tabela antiga (opcional - faça apenas após confirmar que tudo está funcionando)
-- DROP TABLE public.refunds;

## Configuração do Storage no Supabase

Para que o upload de arquivos funcione corretamente, é necessário configurar o bucket de armazenamento no Supabase:

1. Acesse o painel de administração do Supabase
2. Vá para **Storage** > **Buckets**
3. Crie um bucket chamado `doc_media` e marque-o como público
4. Configure as políticas de acesso executando o arquivo SQL:

```bash
# Se você tiver o Supabase CLI instalado:
supabase db execute --file=./sql/storage_policies.sql

# Ou copie o conteúdo do arquivo sql/storage_policies.sql e execute no SQL Editor do Supabase
```

Para instruções detalhadas, consulte o arquivo [GUIA_CONFIGURACAO_STORAGE.md](./GUIA_CONFIGURACAO_STORAGE.md).

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

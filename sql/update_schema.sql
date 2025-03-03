-- Remover objetos existentes
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.app_users;
DROP POLICY IF EXISTS "Apenas admins podem inserir usuários" ON public.app_users;
DROP POLICY IF EXISTS "Apenas admins podem atualizar usuários" ON public.app_users;
DROP POLICY IF EXISTS "Apenas admins podem deletar usuários" ON public.app_users;

-- Verificar se a tabela data existe antes de tentar remover políticas
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'data') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admins e suporte podem ver reembolsos" ON public.data';
        EXECUTE 'DROP POLICY IF EXISTS "Admins e suporte podem inserir reembolsos" ON public.data';
        EXECUTE 'DROP POLICY IF EXISTS "Admins e suporte podem atualizar reembolsos" ON public.data';
        EXECUTE 'DROP POLICY IF EXISTS "Apenas admins podem deletar reembolsos" ON public.data';
    END IF;
END $$;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS can_access_refunds() CASCADE;
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

-- Verificar se a tabela refunds existe antes de tentar copiar dados
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'refunds') THEN
        EXECUTE '
        INSERT INTO public.data (id, created_at, customer_name, amount, type, status, created_by, updated_by)
        SELECT id, created_at, customer_name, amount, type, status, created_by, updated_by
        FROM public.refunds';
    END IF;
END $$; 
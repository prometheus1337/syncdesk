-- Criar tabela para seções de documentação
CREATE TABLE doc_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para itens de documentação
CREATE TABLE doc_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES doc_sections(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES doc_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar a performance
CREATE INDEX doc_items_section_id_idx ON doc_items(section_id);
CREATE INDEX doc_items_parent_id_idx ON doc_items(parent_id);

-- Criar função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar o timestamp de updated_at
CREATE TRIGGER update_doc_sections_updated_at
BEFORE UPDATE ON doc_sections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doc_items_updated_at
BEFORE UPDATE ON doc_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Configurar políticas de segurança RLS (Row Level Security)
ALTER TABLE doc_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_items ENABLE ROW LEVEL SECURITY;

-- Políticas para doc_sections
-- Qualquer usuário autenticado pode visualizar
CREATE POLICY "Qualquer usuário autenticado pode visualizar seções" 
ON doc_sections FOR SELECT 
TO authenticated 
USING (true);

-- Apenas administradores podem inserir, atualizar ou excluir
CREATE POLICY "Apenas administradores podem inserir seções" 
ON doc_sections FOR INSERT 
TO authenticated 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Apenas administradores podem atualizar seções" 
ON doc_sections FOR UPDATE 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Apenas administradores podem excluir seções" 
ON doc_sections FOR DELETE 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para doc_items
-- Qualquer usuário autenticado pode visualizar
CREATE POLICY "Qualquer usuário autenticado pode visualizar documentos" 
ON doc_items FOR SELECT 
TO authenticated 
USING (true);

-- Apenas administradores podem inserir, atualizar ou excluir
CREATE POLICY "Apenas administradores podem inserir documentos" 
ON doc_items FOR INSERT 
TO authenticated 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Apenas administradores podem atualizar documentos" 
ON doc_items FOR UPDATE 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Apenas administradores podem excluir documentos" 
ON doc_items FOR DELETE 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

-- Inserir alguns dados de exemplo
INSERT INTO doc_sections (title, description, "order") VALUES
('Introdução', 'Documentos introdutórios sobre a plataforma', 1),
('Tutoriais', 'Guias passo a passo para tarefas comuns', 2),
('FAQ', 'Perguntas frequentes sobre a plataforma', 3);

-- Inserir alguns documentos de exemplo
INSERT INTO doc_items (section_id, parent_id, title, content, "order") VALUES
((SELECT id FROM doc_sections WHERE title = 'Introdução'), NULL, 'Bem-vindo à Plataforma', '# Bem-vindo à nossa plataforma\n\nEsta documentação irá ajudá-lo a entender como utilizar todas as funcionalidades disponíveis.\n\n## O que você pode fazer\n\n- Gerenciar reembolsos\n- Administrar usuários\n- Acessar documentação\n\n> **Dica:** Utilize a barra de navegação para acessar diferentes áreas do sistema.', 1),
((SELECT id FROM doc_sections WHERE title = 'Introdução'), NULL, 'Primeiros Passos', '# Primeiros Passos\n\nAqui estão os primeiros passos para começar a utilizar a plataforma:\n\n1. Faça login com suas credenciais\n2. Navegue pelo menu principal\n3. Explore as diferentes funcionalidades\n\n```\n// Exemplo de código\nconst usuario = {\n  nome: "Seu Nome",\n  perfil: "admin"\n};\n```', 2),
((SELECT id FROM doc_sections WHERE title = 'Tutoriais'), NULL, 'Como gerenciar reembolsos', '# Como gerenciar reembolsos\n\nEste tutorial explica como gerenciar reembolsos na plataforma.\n\n## Passos\n\n1. Acesse a seção "Reembolsos"\n2. Utilize os filtros para encontrar o reembolso desejado\n3. Clique no reembolso para ver detalhes\n4. Atualize o status conforme necessário\n\n![Exemplo de imagem](https://via.placeholder.com/500x300)', 1),
((SELECT id FROM doc_sections WHERE title = 'FAQ'), NULL, 'Perguntas Comuns', '# Perguntas Frequentes\n\n## Como alterar minha senha?\n\nPara alterar sua senha, acesse seu perfil e clique em "Alterar senha".\n\n## Como adicionar um novo usuário?\n\nApenas administradores podem adicionar novos usuários. Acesse a seção "Gerenciar Usuários" e clique em "Novo Usuário".', 1); 
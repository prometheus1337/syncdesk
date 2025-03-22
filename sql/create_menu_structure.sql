-- Criar enum para tipos de item de menu
CREATE TYPE menu_item_type AS ENUM ('link', 'dropdown');

-- Criar enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'support', 'student', 'teacher');

-- Criar tabela de menus
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    type menu_item_type NOT NULL,
    icon TEXT,
    path TEXT,
    parent_id INTEGER REFERENCES menu_items(id),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de permissões do menu
CREATE TABLE menu_permissions (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id),
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(menu_item_id, role)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO menu_items (title, type, icon, path, parent_id, order_index) VALUES
-- Dropdowns principais
('Ferramentas', 'dropdown', 'tools', null, null, 1),
('Redação', 'dropdown', 'edit', null, null, 2),

-- Items do dropdown Ferramentas
('Relatórios', 'link', 'chart', '/relatorios', 1, 1),
('Gerador de Imagens', 'link', 'image', '/gerador-imagens', 1, 2),
('Reembolsos', 'link', 'refresh', '/reembolsos', 1, 3),
('Administração', 'link', 'settings', '/admin', 1, 4),

-- Items do dropdown Redação
('Redações', 'link', 'file-text', '/redacoes', 2, 1),
('Créditos', 'link', 'credit-card', '/creditos', 2, 2);

-- Inserir permissões
INSERT INTO menu_permissions (menu_item_id, role) 
SELECT id, 'admin'::user_role FROM menu_items;

INSERT INTO menu_permissions (menu_item_id, role)
SELECT id, 'support'::user_role 
FROM menu_items 
WHERE title IN ('Relatórios', 'Reembolsos', 'Redações', 'Créditos');

INSERT INTO menu_permissions (menu_item_id, role)
SELECT id, 'teacher'::user_role 
FROM menu_items 
WHERE title IN ('Redações', 'Créditos');

INSERT INTO menu_permissions (menu_item_id, role)
SELECT id, 'student'::user_role 
FROM menu_items 
WHERE title IN ('Redações', 'Créditos'); 
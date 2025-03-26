-- Adiciona o valor 'ambassador' ao enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ambassador'; 
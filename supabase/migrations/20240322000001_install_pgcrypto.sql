-- Instala a extensão pgcrypto no schema public
CREATE SCHEMA IF NOT EXISTS public;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public; 
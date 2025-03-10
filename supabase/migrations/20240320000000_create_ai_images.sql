create table public.ai_images (
  id uuid default gen_random_uuid() primary key,
  prompt text not null,
  aspect_ratio text not null,
  status text default 'pending' not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar policy para permitir inserção e leitura
create policy "Enable insert for all users" on public.ai_images for insert with check (true);
create policy "Enable read access for all users" on public.ai_images for select using (true);

-- Habilitar RLS
alter table public.ai_images enable row level security; 
create table public.generated_images (
    id uuid default gen_random_uuid() primary key,
    url text not null,
    prompt text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) on delete set null
);

-- Habilitar RLS
alter table public.generated_images enable row level security;

-- Criar políticas de acesso
create policy "Permitir leitura para todos os usuários autenticados"
on public.generated_images for select
to authenticated
using (true);

create policy "Permitir inserção para usuários autenticados"
on public.generated_images for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Permitir exclusão apenas para o criador"
on public.generated_images for delete
to authenticated
using (auth.uid() = created_by); 
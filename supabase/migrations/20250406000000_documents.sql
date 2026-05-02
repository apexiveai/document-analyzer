-- Run in Supabase SQL editor if this migration was not applied yet.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  summary text,
  extracted_text text,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents (user_id);

alter table public.documents enable row level security;

create policy "Users read own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

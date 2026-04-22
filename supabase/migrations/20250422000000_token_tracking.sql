-- Add token tracking to documents and create usage_logs table

-- 1. Update documents table with token tracking columns
alter table public.documents
add column if not exists prompt_tokens integer default 0,
add column if not exists completion_tokens integer default 0,
add column if not exists total_tokens integer default 0,
add column if not exists total_cost numeric(10, 5) default 0;

-- 2. Create usage_logs table for detailed tracking
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  action_type text not null, -- e.g., 'document_audit', 'document_analyze'
  token_count integer not null default 0,
  cost numeric(10, 5) default 0,
  created_at timestamptz not null default now()
);

-- 3. Add RLS for usage_logs
alter table public.usage_logs enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'usage_logs' 
        and policyname = 'Users can view their own usage logs'
    ) then
        create policy "Users can view their own usage logs"
          on public.usage_logs for select
          using (auth.uid() = user_id);
    end if;

    if not exists (
        select 1 from pg_policies 
        where tablename = 'usage_logs' 
        and policyname = 'System can insert usage logs'
    ) then
        create policy "System can insert usage logs"
          on public.usage_logs for insert
          with check (auth.uid() = user_id);
    end if;
end $$;

-- 4. Create indexes
create index if not exists usage_logs_user_id_idx on public.usage_logs (user_id);
create index if not exists usage_logs_document_id_idx on public.usage_logs (document_id);
-- 5. Create user_profiles for tier tracking
create table if not exists public.user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'FREE',
  updated_at timestamptz not null default now()
);

-- RLS for user_profiles
alter table public.user_profiles enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'user_profiles' 
        and policyname = 'Users can view their own profile'
    ) then
        create policy "Users can view their own profile"
          on public.user_profiles for select
          using (auth.uid() = id);
    end if;

    if not exists (
        select 1 from pg_policies 
        where tablename = 'user_profiles' 
        and policyname = 'Users can update their own profile'
    ) then
        create policy "Users can update their own profile"
          on public.user_profiles for update
          using (auth.uid() = id);
    end if;
end $$;

-- Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Create local_payments table for MMQR verification
create table if not exists public.local_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  screenshot_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- RLS for local_payments
alter table public.local_payments enable row level security;

create policy "Users can view their own local payments"
  on public.local_payments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own local payments"
  on public.local_payments for insert
  with check (auth.uid() = user_id);

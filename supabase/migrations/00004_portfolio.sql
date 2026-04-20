create table if not exists public.portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  child_id text not null,
  activity_id text,
  image_storage_path text not null,
  intelligences text[] not null default '{}',
  tags text[] not null default '{}',
  caption text not null default '',
  stage text not null check (stage in ('sensorimotor', 'preoperational', 'concrete-operational', 'formal-operational')),
  include_in_report boolean not null default false,
  created_at timestamptz not null default now()
);

create index portfolio_entries_user_child_idx
  on public.portfolio_entries (user_id, child_id, created_at desc);

alter table public.portfolio_entries enable row level security;

create policy "portfolio_select_own"
  on public.portfolio_entries for select to authenticated
  using (auth.uid() = user_id);

create policy "portfolio_insert_own"
  on public.portfolio_entries for insert to authenticated
  with check (auth.uid() = user_id);

create policy "portfolio_update_own"
  on public.portfolio_entries for update to authenticated
  using (auth.uid() = user_id);

create policy "portfolio_delete_own"
  on public.portfolio_entries for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.portfolio_entries to authenticated;

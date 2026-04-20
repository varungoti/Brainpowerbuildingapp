create table if not exists public.narrative_cache (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  week_end date not null,
  narrative text not null,
  model text not null default 'gpt-4o',
  generated_at timestamptz not null default now(),
  unique (child_id, week_start)
);

create index narrative_cache_child_week_idx
  on public.narrative_cache (child_id, week_start desc);

alter table public.narrative_cache enable row level security;

create policy "narrative_select_own"
  on public.narrative_cache for select to authenticated
  using (auth.uid() = user_id);

create policy "narrative_insert_own"
  on public.narrative_cache for insert to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.narrative_cache to authenticated;
grant all on public.narrative_cache to service_role;

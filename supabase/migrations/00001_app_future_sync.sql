-- Future: cloud sync for NeuroSpark (not wired in app yet).
-- Run in Supabase SQL editor when you enable multi-device backup.

-- create table public.profiles (
--   id uuid primary key references auth.users (id) on delete cascade,
--   display_name text,
--   updated_at timestamptz default now()
-- );

-- create table public.child_snapshots (
--   id uuid primary key default gen_random_uuid(),
--   user_id uuid references auth.users (id) on delete cascade not null,
--   payload jsonb not null,
--   updated_at timestamptz default now()
-- );

-- alter table public.profiles enable row level security;
-- create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);

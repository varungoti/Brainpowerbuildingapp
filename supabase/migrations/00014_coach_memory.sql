-- ============================================================================
-- 00014_coach_memory.sql
-- ----------------------------------------------------------------------------
-- Survivor 1: Companion Coach.
-- Append-only "observation" log per child that the parent-coach reads back
-- when answering parents' questions. Strictly RLS-isolated by child + user.
-- TTL 180 days (a daily Edge cron purges older rows).
-- ============================================================================

create table if not exists public.coach_memory (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  child_id    text not null,
  -- Free-text observation. ≤ 800 chars enforced at the API boundary.
  observation text not null,
  -- Coarse category for retrieval scoring.
  topic       text not null check (topic in (
    'sleep','meltdown','rupture-repair','milestone','language',
    'social','sibling','school','health','emotion','curiosity','other'
  )) default 'other',
  -- Optional embedding hint — not vector here; we keep this dependency-free.
  -- A separate index can be added later if we adopt pgvector.
  weight      smallint not null default 1 check (weight between 1 and 5),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '180 days')
);

create index if not exists coach_memory_child_recent_idx on public.coach_memory(child_id, created_at desc);
create index if not exists coach_memory_user_idx on public.coach_memory(user_id);
create index if not exists coach_memory_expiry_idx on public.coach_memory(expires_at);

alter table public.coach_memory enable row level security;

create policy "coach_memory_self_select"
  on public.coach_memory for select to authenticated
  using (user_id = auth.uid());
create policy "coach_memory_self_insert"
  on public.coach_memory for insert to authenticated
  with check (user_id = auth.uid());
create policy "coach_memory_self_delete"
  on public.coach_memory for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, delete on public.coach_memory to authenticated;
grant usage, select on sequence coach_memory_id_seq to authenticated;

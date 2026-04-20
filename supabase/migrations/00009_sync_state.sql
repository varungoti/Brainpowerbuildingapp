-- ============================================================================
-- 00009_sync_state.sql
-- ----------------------------------------------------------------------------
-- Per-user opaque state blob with optimistic versioning. The Edge Function
-- /sync/state mirrors writes to KV today; this table is a forward-looking
-- target so the same data can be queried directly from Postgres once we
-- migrate off KV.
-- ============================================================================

create table if not exists public.user_sync_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state   jsonb not null,
  version bigint not null default 1,
  device_id text,
  updated_at timestamptz not null default now()
);

create index if not exists user_sync_state_updated_idx on public.user_sync_state (updated_at desc);

alter table public.user_sync_state enable row level security;

create policy "sync_state_select_self"
  on public.user_sync_state for select to authenticated
  using (auth.uid() = user_id);

create policy "sync_state_insert_self"
  on public.user_sync_state for insert to authenticated
  with check (auth.uid() = user_id);

create policy "sync_state_update_self"
  on public.user_sync_state for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sync_state_delete_self"
  on public.user_sync_state for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_sync_state to authenticated;

create table if not exists public.caregiver_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  child_id text not null,
  role text not null check (role in ('primary', 'caregiver', 'observer')),
  invited_by uuid not null references auth.users (id),
  accepted_at timestamptz,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  unique (user_id, child_id)
);

create index caregiver_links_child_idx on public.caregiver_links (child_id);
create index caregiver_links_user_idx on public.caregiver_links (user_id);

alter table public.caregiver_links enable row level security;

create policy "caregiver_select_linked"
  on public.caregiver_links for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
        and cl.user_id = auth.uid()
    )
  );

create policy "caregiver_insert_primary"
  on public.caregiver_links for insert to authenticated
  with check (
    exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
        and cl.user_id = auth.uid()
        and cl.role = 'primary'
    )
    or not exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
    )
  );

create policy "caregiver_update"
  on public.caregiver_links for update to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
        and cl.user_id = auth.uid()
        and cl.role = 'primary'
    )
  );

create policy "caregiver_delete"
  on public.caregiver_links for delete to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
        and cl.user_id = auth.uid()
        and cl.role = 'primary'
    )
  );

grant select, insert, update, delete on public.caregiver_links to authenticated;

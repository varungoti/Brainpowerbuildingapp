-- Admin roles + audit log + RLS hardening for the NeuroSpark admin backend.

do $$ begin
  create type admin_role as enum ('superadmin','analyst','support','marketing','readonly');
exception when duplicate_object then null;
end $$;

create table if not exists admin_users (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  email     text not null,
  role      admin_role not null default 'readonly',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  disabled_at timestamptz
);
create index if not exists admin_users_role_idx on admin_users(role);

create or replace function is_admin(min_role admin_role default 'readonly')
returns boolean
language sql stable
as $$
  select exists(
    select 1 from admin_users a
    where a.user_id = auth.uid()
      and a.disabled_at is null
      and (
        case a.role
          when 'superadmin' then 5
          when 'analyst'    then 4
          when 'marketing'  then 3
          when 'support'    then 2
          when 'readonly'   then 1
        end
        >=
        case min_role
          when 'superadmin' then 5
          when 'analyst'    then 4
          when 'marketing'  then 3
          when 'support'    then 2
          when 'readonly'   then 1
        end
      )
  );
$$;

create table if not exists admin_audit_log (
  id          bigserial primary key,
  actor_id    uuid references auth.users(id),
  actor_email text,
  action      text not null,
  target_type text,
  target_id   text,
  payload     jsonb,
  ip          inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists admin_audit_log_actor on admin_audit_log(actor_id, created_at desc);
create index if not exists admin_audit_log_action on admin_audit_log(action, created_at desc);

alter table admin_users enable row level security;
alter table admin_audit_log enable row level security;

drop policy if exists admin_users_self_or_admin on admin_users;
create policy admin_users_self_or_admin on admin_users
  for select using (auth.uid() = user_id or is_admin('analyst'));

drop policy if exists admin_users_superadmin_write on admin_users;
create policy admin_users_superadmin_write on admin_users
  for all using (is_admin('superadmin')) with check (is_admin('superadmin'));

drop policy if exists admin_audit_log_admin_read on admin_audit_log;
create policy admin_audit_log_admin_read on admin_audit_log
  for select using (is_admin('analyst'));

-- Tighten existing tables: previously app data was reachable only via the
-- service role; admins now also need read paths. Add admin-read policies
-- that do not weaken end-user RLS.
do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','children','sessions','activity_attempts','milestones',
    'caregivers','caregiver_invites','narrative_cache','portfolio_entries',
    'subscriptions','feedback','events_sink'
  ]) loop
    if exists (select 1 from information_schema.tables where table_name = t and table_schema='public') then
      execute format('drop policy if exists %I_admin_read on public.%I', t, t);
      execute format('create policy %I_admin_read on public.%I for select using (is_admin(''analyst''))', t, t);
    end if;
  end loop;
end $$;

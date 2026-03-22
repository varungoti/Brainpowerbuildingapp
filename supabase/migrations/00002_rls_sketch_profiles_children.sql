-- NeuroSpark — RLS policy sketch (do not run blindly; align with real schema first).
-- Companion: docs/SUPABASE_SCHEMA_PLAN.md
--
-- 1. Create tables when you wire cloud sync (see 00001_app_future_sync.sql for JSON snapshot variant).
-- 2. Uncomment and adjust column names to match your migration.
-- 3. Verify with: select * from pg_policies where tablename in ('profiles','children','activity_logs');

-- Example: profiles (1:1 auth.users)
-- alter table public.profiles enable row level security;
-- create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
-- create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
-- create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Example: children owned by parent user_id
-- alter table public.children enable row level security;
-- create policy "children_select_own" on public.children for select using (auth.uid() = user_id);
-- create policy "children_insert_own" on public.children for insert with check (auth.uid() = user_id);
-- create policy "children_update_own" on public.children for update using (auth.uid() = user_id);
-- create policy "children_delete_own" on public.children for delete using (auth.uid() = user_id);

-- Example: append-only activity_logs
-- alter table public.activity_logs enable row level security;
-- create policy "logs_select_own" on public.activity_logs for select using (auth.uid() = user_id);
-- create policy "logs_insert_own" on public.activity_logs for insert with check (auth.uid() = user_id);
-- -- Optional: deny update/delete for true append-only
-- create policy "logs_no_update" on public.activity_logs for update using (false);
-- create policy "logs_no_delete" on public.activity_logs for delete using (false);

-- Never grant anon INSERT/SELECT on child tables except via strictly scoped Edge Functions + service role.

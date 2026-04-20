-- ============================================================================
-- 00013_child_sleep_signal.sql
-- ----------------------------------------------------------------------------
-- Survivor 4: Sleep × Cognition Loop.
-- Append-only per-child sleep nights (UNION conflict-resolution per the sync
-- rules). Source can be wearable (HealthKit / Health Connect / Fitbit / Oura)
-- or a manual parent-logged window. We never store seconds in cloud — only a
-- 4-bucket categorical so AGE can adapt without exposing raw biometrics.
--
-- Bucket spec (peer-reviewed mediation evidence: glymphatic clearance ~10.9%
-- of variance in cognition outcomes — ABCD cohort 2025):
--   excellent  — ≥ recommended hours for age + ≤1 awakening
--   adequate   — recommended ± 30 min
--   short      — 30-90 min below recommended
--   deficient  — > 90 min below recommended
-- Recommended hours by age band: 0-2 → 11-14h, 3-5 → 10-13h, 6-12 → 9-12h.
-- Conversion to bucket happens client-side; only the bucket is uploaded.
-- ============================================================================

create table if not exists public.child_sleep_signal (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  child_id      text not null,
  -- Calendar date the sleep night ended (YYYY-MM-DD in the child's timezone).
  night_date    date not null,
  bucket        text not null check (bucket in ('excellent','adequate','short','deficient')),
  source        text not null check (source in ('healthkit','health-connect','fitbit','oura','manual','imported')),
  -- Optional partial timezone offset for analytics (no PII).
  tz_offset_min int,
  created_at    timestamptz not null default now(),
  unique (user_id, child_id, night_date)
);

create index if not exists child_sleep_signal_child_date_idx on public.child_sleep_signal(child_id, night_date desc);

alter table public.child_sleep_signal enable row level security;

create policy "child_sleep_self_select"
  on public.child_sleep_signal for select to authenticated
  using (user_id = auth.uid() or is_admin('readonly'));
create policy "child_sleep_self_insert"
  on public.child_sleep_signal for insert to authenticated
  with check (user_id = auth.uid());
create policy "child_sleep_self_update"
  on public.child_sleep_signal for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "child_sleep_self_delete"
  on public.child_sleep_signal for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.child_sleep_signal to authenticated;
grant usage, select on sequence child_sleep_signal_id_seq to authenticated;

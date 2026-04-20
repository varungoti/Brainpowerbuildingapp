-- Survivor 6 — Clinical Wedge.
--
-- Two tables:
--   1. well_child_snapshots : per-child cached snapshot data (the parent
--      generates one before each well-child visit; we cache so partners can
--      reproduce the exact numbers the PDF showed).
--   2. partner_snapshot_shares : revocable tokens the parent issues so a
--      pediatrician / employer-benefit platform can fetch the snapshot via
--      `/partners/snapshot-summary?token=…`.
--
-- Compliance posture: snapshots are developmental observations, never
-- clinical diagnoses. RLS enforces parent ownership; partner reads are
-- token-gated and never authenticated as a user.

create table if not exists public.well_child_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id text not null,
  generated_at timestamptz not null default now(),
  anchor_months int not null,
  child_age_months int not null,
  posteriors jsonb not null,                 -- BayesianPrediction[]
  top_regions jsonb not null,                -- { region, count }[]
  underserved_regions jsonb not null,
  total_practice_minutes int not null default 0
);

create index if not exists well_child_snapshots_user_child_idx
  on public.well_child_snapshots (user_id, child_id, generated_at desc);

alter table public.well_child_snapshots enable row level security;

drop policy if exists "snapshots: parent rw" on public.well_child_snapshots;
create policy "snapshots: parent rw"
  on public.well_child_snapshots
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.partner_snapshot_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_id text not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

create index if not exists partner_snapshot_shares_token_idx
  on public.partner_snapshot_shares (token);
create index if not exists partner_snapshot_shares_user_idx
  on public.partner_snapshot_shares (user_id, created_at desc);

alter table public.partner_snapshot_shares enable row level security;

drop policy if exists "shares: parent rw" on public.partner_snapshot_shares;
create policy "shares: parent rw"
  on public.partner_snapshot_shares
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Note: the public `/partners/snapshot-summary?token=…` endpoint reads
-- partner_snapshot_shares + well_child_snapshots through the service-role
-- key (token is the auth secret) — RLS does not need to authorise it.

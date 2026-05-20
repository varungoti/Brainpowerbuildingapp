-- 00018_marketing_os.sql
-- Marketing OS: lightweight CRM (leads/posts/tasks/payments) + Social OS
-- (accounts/posts/post_targets/events/media_assets) + revenue ledger view.
--
-- Composes with the existing growth_command_center migration but does not
-- replace it; this layer is for hands-on daily execution (lead capture,
-- content scheduling, payment ingestion) while the Growth Command Center
-- owns OKRs, kill switches, readiness, and approvals.
--
-- Idempotent. Service-role only RLS by design — admin UI calls these via
-- the existing edge functions which use the service role client.

create extension if not exists "pgcrypto";

-- ── CRM ─────────────────────────────────────────────────────────────────────
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null,
  phone text,
  email text,
  city text,
  child_age int,
  concern text,
  persona text default 'Unknown',
  source text default 'Manual Add',
  status text default 'New',
  notes text,
  score int default 0,
  temperature text default 'Cold',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crm_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text,
  content text not null,
  status text default 'Draft',
  views int default 0,
  likes int default 0,
  comments int default 0,
  dms int default 0,
  leads int default 0,
  payments int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  status text default 'Scheduled',
  lead_id uuid references public.crm_leads(id) on delete set null,
  payload jsonb default '{}'::jsonb,
  run_at timestamptz default now(),
  attempts int default 0,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.crm_payments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete set null,
  provider text default 'manual',
  provider_payment_id text,
  plan_id text,
  plan_name text,
  amount numeric(12,2) not null default 0,
  currency text default 'INR',
  status text default 'Paid',
  paid_at timestamptz default now(),
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ── Social OS ───────────────────────────────────────────────────────────────
create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  account_label text,
  provider_account_id text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  expires_at timestamptz,
  scopes text[] default '{}',
  status text default 'needs_oauth',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.social_media_assets (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  mime_type text,
  width int,
  height int,
  duration_seconds int,
  alt_text text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  approval_status text default 'draft',
  scheduled_at timestamptz,
  campaign text,
  cta text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.social_post_targets (
  id uuid primary key default gen_random_uuid(),
  social_post_id uuid not null references public.social_posts(id) on delete cascade,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  provider text not null,
  status text default 'scheduled',
  provider_post_id text,
  publish_response jsonb default '{}'::jsonb,
  error text,
  attempts int default 0,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.social_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  social_post_target_id uuid references public.social_post_targets(id) on delete set null,
  event_type text not null,
  actor_id text,
  actor_name text,
  content text,
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ── Revenue Sprint daily progress (per-day rollup; powers admin gauge) ──────
create table if not exists public.revenue_sprint_days (
  id uuid primary key default gen_random_uuid(),
  sprint_day int not null,
  sprint_date date not null,
  goal_usd numeric(12,2) not null default 1000,
  actual_usd numeric(12,2) not null default 0,
  partner_usd numeric(12,2) not null default 0,
  consumer_usd numeric(12,2) not null default 0,
  founder_usd numeric(12,2) not null default 0,
  leads_added int not null default 0,
  posts_published int not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (sprint_date)
);

-- Live consolidated view: revenue per offer (consumer / partner / founder),
-- driven off crm_payments. Admin Marketing OS dashboard reads this once.
create or replace view public.revenue_ledger_v as
select
  date_trunc('day', paid_at)::date as paid_on,
  coalesce(plan_id, 'unknown') as plan_id,
  coalesce(plan_name, 'Untitled offer') as plan_name,
  case
    when plan_id ilike 'partner%' then 'partner'
    when plan_id ilike 'bundle%' or plan_id ilike 'pro%' then 'consumer'
    when plan_id ilike 'beta%' then 'consumer'
    when plan_id ilike 'founder%' then 'founder'
    else 'consumer'
  end as track,
  count(*) as transactions,
  sum(amount) as amount_total,
  -- crude USD conversion for INR; admin UI overrides for non-INR currencies
  case
    when min(currency) = 'INR' then round(sum(amount) / 84.0, 2)
    else sum(amount)
  end as amount_usd_estimate
from public.crm_payments
where status = 'Paid'
group by 1, 2, 3, 4;

-- ── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_crm_tasks_status_run_at on public.crm_tasks(status, run_at);
create index if not exists idx_crm_leads_status on public.crm_leads(status);
create index if not exists idx_crm_leads_temp on public.crm_leads(temperature);
create index if not exists idx_crm_payments_paid_at on public.crm_payments(paid_at desc);
create index if not exists idx_social_post_targets_status_scheduled on public.social_post_targets(status, scheduled_at);
create index if not exists idx_social_accounts_provider_status on public.social_accounts(provider, status);
create index if not exists idx_social_posts_scheduled_at on public.social_posts(scheduled_at);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.crm_leads enable row level security;
alter table public.crm_posts enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.crm_payments enable row level security;
alter table public.social_accounts enable row level security;
alter table public.social_media_assets enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_post_targets enable row level security;
alter table public.social_events enable row level security;
alter table public.revenue_sprint_days enable row level security;

-- Service-role only: admin UI must use the existing edge functions.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_leads' and policyname='service_role_all_crm_leads') then
    create policy "service_role_all_crm_leads" on public.crm_leads for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_posts' and policyname='service_role_all_crm_posts') then
    create policy "service_role_all_crm_posts" on public.crm_posts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_tasks' and policyname='service_role_all_crm_tasks') then
    create policy "service_role_all_crm_tasks" on public.crm_tasks for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_payments' and policyname='service_role_all_crm_payments') then
    create policy "service_role_all_crm_payments" on public.crm_payments for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='social_accounts' and policyname='service_role_all_social_accounts') then
    create policy "service_role_all_social_accounts" on public.social_accounts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='social_media_assets' and policyname='service_role_all_social_media_assets') then
    create policy "service_role_all_social_media_assets" on public.social_media_assets for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='social_posts' and policyname='service_role_all_social_posts') then
    create policy "service_role_all_social_posts" on public.social_posts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='social_post_targets' and policyname='service_role_all_social_post_targets') then
    create policy "service_role_all_social_post_targets" on public.social_post_targets for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='social_events' and policyname='service_role_all_social_events') then
    create policy "service_role_all_social_events" on public.social_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='revenue_sprint_days' and policyname='service_role_all_revenue_sprint_days') then
    create policy "service_role_all_revenue_sprint_days" on public.revenue_sprint_days for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
  end if;
end $$;

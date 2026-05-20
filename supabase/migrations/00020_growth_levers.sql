-- 00020_growth_levers.sql
-- Growth Levers: the measurement + optimization layer that turns the existing
-- Growth Command Center into a closed loop for user-base + subscription growth.
--
-- Six new surfaces, all idempotent:
--   1. growth_funnel_events       — per-event activation funnel data
--   2. growth_paywall_variants    — A/B test definitions for paywall copy/price
--   3. growth_paywall_assignments — sticky variant assignment per anon actor
--   4. growth_referral_codes      — one code per referrer
--   5. growth_referral_redemptions — attribution + reward state
--   6. growth_lifecycle_rules     — admin-defined "if X then nudge" rules
--      + growth_lifecycle_runs    — execution log
--
-- Plus analytical views:
--   growth_funnel_overview_v
--   growth_paywall_conversion_v
--   growth_subscription_health_v   (degrades gracefully if subscriptions table absent)
--   growth_cohort_retention_v
--   growth_referral_metrics_v
--   growth_lifecycle_due_v
--
-- Privacy:
--   - growth_funnel_events stores only `actor_hash` (sha256 of device id +
--     pepper), never raw user_id or PII. The client never sends an email.
--   - paywall variant assignment is sticky by actor_hash so a given device
--     always sees the same variant.

create extension if not exists "pgcrypto";

-- ── 1. Funnel events ─────────────────────────────────────────────────────────
-- Every funnel-relevant client event lands here. Subset of ALLOWED_ANALYTICS:
--   auth_submit_success, onboard_complete, first_activity_open,
--   first_activity_complete, paywall_view, paywall_plan_select,
--   paywall_checkout_start, paywall_purchase_success, paywall_purchase_fail
create table if not exists public.growth_funnel_events (
  id          bigint generated always as identity primary key,
  actor_hash  text not null,
  event_name  text not null,
  variant_key text,
  props       jsonb not null default '{}'::jsonb,
  utm_source  text,
  utm_campaign text,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_funnel_events_actor on public.growth_funnel_events(actor_hash, occurred_at);
create index if not exists idx_funnel_events_name_time on public.growth_funnel_events(event_name, occurred_at desc);
create index if not exists idx_funnel_events_variant on public.growth_funnel_events(variant_key, event_name) where variant_key is not null;
create index if not exists idx_funnel_events_utm on public.growth_funnel_events(utm_source, utm_campaign);

-- ── 2. Paywall variants + sticky assignment ─────────────────────────────────
create table if not exists public.growth_paywall_variants (
  id              uuid primary key default gen_random_uuid(),
  variant_key     text not null unique,
  name            text not null,
  headline        text,
  sub_copy        text,
  price_label     text,
  plan_id         text,
  allocation_pct  int not null default 50 check (allocation_pct between 0 and 100),
  status          text not null default 'draft'
    check (status in ('draft','active','paused','retired')),
  hypothesis      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.growth_paywall_assignments (
  actor_hash    text primary key,
  variant_key   text not null references public.growth_paywall_variants(variant_key) on delete cascade,
  assigned_at   timestamptz not null default now()
);
create index if not exists idx_paywall_assignments_variant on public.growth_paywall_assignments(variant_key);

-- ── 3. Referral codes + redemptions ─────────────────────────────────────────
create table if not exists public.growth_referral_codes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,
  code            text not null unique,
  reward_label    text default '1 free month for both',
  status          text not null default 'active' check (status in ('active','disabled')),
  uses_count      int not null default 0,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_referral_codes_user on public.growth_referral_codes(user_id);

create table if not exists public.growth_referral_redemptions (
  id              uuid primary key default gen_random_uuid(),
  code            text not null,
  referrer_user_id uuid,
  redeemed_actor_hash text,
  redeemed_user_id uuid,
  status          text not null default 'pending'
    check (status in ('pending','rewarded','reversed','rejected')),
  reward_amount_inr numeric(10,2) default 0,
  rewarded_at     timestamptz,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists idx_referral_redemptions_code on public.growth_referral_redemptions(code);
create index if not exists idx_referral_redemptions_status on public.growth_referral_redemptions(status, created_at);

-- ── 4. Lifecycle rules + run log ─────────────────────────────────────────────
-- Admin-defined "if dormant X days, send Y" automation. The runner (manual
-- or future cron) compiles each rule into queue items in crm_tasks.
create table if not exists public.growth_lifecycle_rules (
  id              uuid primary key default gen_random_uuid(),
  rule_key        text not null unique,
  name            text not null,
  segment         text not null default 'all',
  trigger_kind    text not null
    check (trigger_kind in ('inactive_days','signup_day_n','paywall_abandoned','subscription_expiring','first_activity_missing')),
  trigger_params  jsonb not null default '{}'::jsonb,
  action_kind     text not null
    check (action_kind in ('push','email','whatsapp','in_app_banner')),
  action_params   jsonb not null default '{}'::jsonb,
  enabled         boolean not null default true,
  cooldown_hours  int not null default 24 check (cooldown_hours >= 0),
  last_run_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.growth_lifecycle_runs (
  id              uuid primary key default gen_random_uuid(),
  rule_id         uuid references public.growth_lifecycle_rules(id) on delete cascade,
  ran_at          timestamptz not null default now(),
  target_count    int not null default 0,
  enqueued_count  int not null default 0,
  error           text
);
create index if not exists idx_lifecycle_runs_rule on public.growth_lifecycle_runs(rule_id, ran_at desc);

-- ── 5. Analytical views ──────────────────────────────────────────────────────

-- Funnel overview: counts per stage per day, plus the cumulative actor reach
-- per stage across the lookback window.
create or replace view public.growth_funnel_overview_v as
with stages as (
  select unnest(array[
    'auth_submit_success',
    'onboard_complete',
    'first_activity_open',
    'first_activity_complete',
    'paywall_view',
    'paywall_checkout_start',
    'paywall_purchase_success'
  ]) as stage
)
select
  s.stage,
  date_trunc('day', e.occurred_at)::date as day,
  count(distinct e.actor_hash) as actors,
  count(*) as events
from stages s
left join public.growth_funnel_events e on e.event_name = s.stage
group by s.stage, date_trunc('day', e.occurred_at)::date;

-- Paywall variant conversion: views, plan selects, checkout starts, purchases
-- per variant. Per-row conversion = purchases / views.
create or replace view public.growth_paywall_conversion_v as
select
  v.variant_key,
  v.name,
  v.status,
  v.allocation_pct,
  coalesce(stats.assigned, 0) as assigned,
  coalesce(stats.views, 0) as views,
  coalesce(stats.checkout_starts, 0) as checkout_starts,
  coalesce(stats.purchases, 0) as purchases,
  case
    when coalesce(stats.views, 0) = 0 then 0
    else round((coalesce(stats.purchases, 0)::numeric / stats.views::numeric) * 100, 2)
  end as view_to_paid_pct,
  case
    when coalesce(stats.checkout_starts, 0) = 0 then 0
    else round((coalesce(stats.purchases, 0)::numeric / stats.checkout_starts::numeric) * 100, 2)
  end as checkout_to_paid_pct
from public.growth_paywall_variants v
left join (
  select
    e.variant_key,
    count(distinct case when e.event_name = 'paywall_view' then e.actor_hash end) as views,
    count(*) filter (where e.event_name = 'paywall_checkout_start') as checkout_starts,
    count(*) filter (where e.event_name = 'paywall_purchase_success') as purchases,
    count(distinct case when e.event_name = 'paywall_view' then e.actor_hash end) as assigned
  from public.growth_funnel_events e
  where e.variant_key is not null
  group by e.variant_key
) stats on stats.variant_key = v.variant_key;

-- Subscription health: gracefully no-op if subscriptions table doesn't exist
-- yet (e.g. fresh project). Wrapped in DO block that creates a stub view.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'subscriptions'
  ) then
    execute $sub$
      create or replace view public.growth_subscription_health_v as
      with active_subs as (
        select * from public.subscriptions
        where status in ('active','trialing','past_due')
      )
      select
        coalesce(plan, 'unknown') as plan,
        coalesce(status, 'unknown') as status,
        count(*) as subscribers,
        count(*) filter (where created_at >= now() - interval '7 days') as new_7d,
        count(*) filter (where created_at >= now() - interval '30 days') as new_30d,
        count(*) filter (where status = 'past_due') as past_due
      from active_subs
      group by plan, status
    $sub$;
  else
    execute $sub$
      create or replace view public.growth_subscription_health_v as
      select
        'no_subscriptions_table'::text as plan,
        'install_migration'::text as status,
        0::bigint as subscribers,
        0::bigint as new_7d,
        0::bigint as new_30d,
        0::bigint as past_due
    $sub$;
  end if;
end $$;

-- Cohort retention: cohort = ISO week of actor's first auth_submit_success.
-- For each cohort, return retained-actors count by day-offset (0..29).
create or replace view public.growth_cohort_retention_v as
with first_seen as (
  select actor_hash, min(occurred_at) as first_seen_at
  from public.growth_funnel_events
  where event_name = 'auth_submit_success'
  group by actor_hash
),
activity as (
  select distinct
    e.actor_hash,
    floor(extract(epoch from (e.occurred_at - f.first_seen_at)) / 86400)::int as day_offset
  from public.growth_funnel_events e
  join first_seen f on f.actor_hash = e.actor_hash
  where e.event_name in ('first_activity_complete', 'first_activity_open', 'paywall_view', 'paywall_purchase_success')
    and e.occurred_at >= f.first_seen_at
    and e.occurred_at < f.first_seen_at + interval '60 days'
)
select
  date_trunc('week', f.first_seen_at)::date as cohort_week,
  a.day_offset,
  count(distinct f.actor_hash) as retained,
  (select count(distinct actor_hash) from first_seen f2 where date_trunc('week', f2.first_seen_at) = date_trunc('week', f.first_seen_at)) as cohort_size
from first_seen f
left join activity a on a.actor_hash = f.actor_hash
where f.first_seen_at >= now() - interval '90 days'
group by date_trunc('week', f.first_seen_at)::date, a.day_offset;

-- Referral metrics: per-code conversion + reward total
create or replace view public.growth_referral_metrics_v as
select
  c.code,
  c.user_id as referrer_user_id,
  c.uses_count,
  count(r.id) filter (where r.status in ('rewarded')) as redeemed,
  count(r.id) filter (where r.status = 'pending') as pending,
  coalesce(sum(r.reward_amount_inr) filter (where r.status = 'rewarded'), 0) as reward_paid_inr
from public.growth_referral_codes c
left join public.growth_referral_redemptions r on r.code = c.code
group by c.code, c.user_id, c.uses_count;

-- Lifecycle rules due: enabled rules whose last_run_at is older than cooldown.
create or replace view public.growth_lifecycle_due_v as
select
  r.id,
  r.rule_key,
  r.name,
  r.segment,
  r.trigger_kind,
  r.trigger_params,
  r.action_kind,
  r.last_run_at,
  r.cooldown_hours,
  case
    when r.last_run_at is null then true
    else r.last_run_at < now() - make_interval(hours => r.cooldown_hours)
  end as due
from public.growth_lifecycle_rules r
where r.enabled = true;

-- ── 6. RLS — service-role only by default ────────────────────────────────────
alter table public.growth_funnel_events enable row level security;
alter table public.growth_paywall_variants enable row level security;
alter table public.growth_paywall_assignments enable row level security;
alter table public.growth_referral_codes enable row level security;
alter table public.growth_referral_redemptions enable row level security;
alter table public.growth_lifecycle_rules enable row level security;
alter table public.growth_lifecycle_runs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'growth_funnel_events',
    'growth_paywall_variants',
    'growth_paywall_assignments',
    'growth_referral_codes',
    'growth_referral_redemptions',
    'growth_lifecycle_rules',
    'growth_lifecycle_runs'
  ] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = format('service_role_all_%s', t)
    ) then
      execute format(
        'create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')',
        format('service_role_all_%s', t), t
      );
    end if;
  end loop;
end $$;

-- ── 7. Seed two starter paywall variants so the dashboard isn't empty ───────
insert into public.growth_paywall_variants(variant_key, name, headline, sub_copy, price_label, plan_id, allocation_pct, status, hypothesis)
values
  ('control', 'Control · current paywall', 'Unlock the full NeuroSpark Beta', 'Lifetime access for early supporters.', '₹999 lifetime', 'beta_v1', 50, 'active', 'Baseline copy'),
  ('outcome_focus', 'Outcome-focused', '10 minutes a day. Sharper focus in 3 weeks.', 'Activities backed by working-memory and emotional-regulation research. Not screen time.', '₹999 lifetime', 'beta_v1', 50, 'active', 'Outcome-led copy converts better than feature-led copy.')
on conflict (variant_key) do nothing;

-- ── 8. Seed three lifecycle rules ────────────────────────────────────────────
insert into public.growth_lifecycle_rules(rule_key, name, segment, trigger_kind, trigger_params, action_kind, action_params, cooldown_hours)
values
  ('reactivate_3d', 'Reactivate after 3-day silence', 'all', 'inactive_days',
    jsonb_build_object('days', 3),
    'push',
    jsonb_build_object('title', 'Your child is missing their 10 minutes', 'body', 'Pick one activity. Build the streak back.'),
    24
  ),
  ('signup_day_2', 'Day-2 onboarding nudge', 'new_signups', 'signup_day_n',
    jsonb_build_object('day', 2),
    'whatsapp',
    jsonb_build_object('template', 'Welcome to NeuroSpark — here is your 5-minute starter activity.'),
    240
  ),
  ('paywall_abandoned_2h', 'Paywall abandoned (2h)', 'all', 'paywall_abandoned',
    jsonb_build_object('hours', 2),
    'in_app_banner',
    jsonb_build_object('headline', '50% off founding price for the next 6 hours', 'cta', 'Resume checkout'),
    24
  )
on conflict (rule_key) do nothing;

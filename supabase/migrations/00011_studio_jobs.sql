-- Studio job storage + cost ledger.
-- Used by /studio/server orchestrator and the admin Studio tab.

create table if not exists studio_jobs (
  id              text primary key,
  template        text not null check (template in (
                    'HeroAnnouncement','FeatureSpotlight','TestimonialCard',
                    'BrainStoryShort','ResearchExplainer','AppDemo')),
  brief           text not null,
  duration_sec    int  not null,
  voice           text not null,
  variant         text not null default 'light',
  status          text not null check (status in (
                    'queued','scripting','awaiting_approval','generating_assets',
                    'rendering','completed','failed','cancelled')),
  title           text,
  subtitle        text,
  scenes          jsonb not null default '[]'::jsonb,
  voiceover_url   text,
  storyboard_url  text,
  mp4_url         text,
  thumbnail_url   text,
  cost_usd        numeric(10,5) not null default 0,
  error           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  approved_at     timestamptz
);
create index if not exists studio_jobs_status_idx on studio_jobs(status, created_at desc);

create table if not exists studio_cost_ledger (
  id          bigserial primary key,
  service     text not null,
  provider    text not null,
  job_id      text references studio_jobs(id) on delete set null,
  cost_usd    numeric(10,5) not null,
  latency_ms  int,
  created_at  timestamptz not null default now()
);
create index if not exists studio_cost_ledger_service_month
  on studio_cost_ledger(service, date_trunc('month', created_at));

alter table studio_jobs enable row level security;
alter table studio_cost_ledger enable row level security;
-- Studio tables are server-only (service role); deny all RLS by default so
-- only the service role key can read/write them. Admin app accesses via Edge.
drop policy if exists studio_jobs_deny_all on studio_jobs;
create policy studio_jobs_deny_all on studio_jobs for all using (false);
drop policy if exists studio_cost_ledger_deny_all on studio_cost_ledger;
create policy studio_cost_ledger_deny_all on studio_cost_ledger for all using (false);

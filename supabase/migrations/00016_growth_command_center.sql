-- Growth Command Center: OKRs, revenue checkpoints, approvals, readiness gates,
-- suppression lists, kill switches, and agent briefs.

create table if not exists growth_daily_okrs (
  id uuid primary key default gen_random_uuid(),
  okr_date date not null unique,
  objective text not null,
  objective_type text not null default 'revenue'
    check (objective_type in ('revenue','partner','creator','launch','conversion','retention','research','production')),
  owner_email text,
  confidence numeric(4,2) not null default 0.70 check (confidence >= 0 and confidence <= 1),
  status text not null default 'planned'
    check (status in ('planned','in_progress','missed','base_hit','stretch_hit','overachieved','cancelled')),
  base_revenue_usd numeric(12,2) not null default 0 check (base_revenue_usd >= 0),
  stretch_revenue_usd numeric(12,2) not null default 0 check (stretch_revenue_usd >= 0),
  over_revenue_usd numeric(12,2) not null default 0 check (over_revenue_usd >= 0),
  actual_revenue_usd numeric(12,2) not null default 0 check (actual_revenue_usd >= 0),
  base_pipeline_usd numeric(12,2) not null default 0 check (base_pipeline_usd >= 0),
  actual_pipeline_usd numeric(12,2) not null default 0 check (actual_pipeline_usd >= 0),
  okr_score numeric(4,2) check (okr_score >= 0 and okr_score <= 2),
  evidence jsonb not null default '[]'::jsonb,
  lessons_learned text,
  next_day_adjustment text,
  recovery_required boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_daily_okrs_date_idx on growth_daily_okrs(okr_date desc);
create index if not exists growth_daily_okrs_status_idx on growth_daily_okrs(status);

create table if not exists growth_key_results (
  id uuid primary key default gen_random_uuid(),
  okr_id uuid not null references growth_daily_okrs(id) on delete cascade,
  label text not null,
  metric_key text not null,
  unit text not null default 'count',
  base_target numeric(12,2) not null default 0,
  stretch_target numeric(12,2) not null default 0,
  over_target numeric(12,2) not null default 0,
  actual_value numeric(12,2) not null default 0,
  status text not null default 'planned'
    check (status in ('planned','in_progress','missed','base_hit','stretch_hit','overachieved','cancelled')),
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_key_results_okr_idx on growth_key_results(okr_id);

create table if not exists growth_revenue_checkpoints (
  id uuid primary key default gen_random_uuid(),
  checkpoint_date date not null default current_date,
  source text not null default 'manual',
  revenue_type text not null default 'cash'
    check (revenue_type in ('cash','signed_contract','pipeline','refund','adjustment')),
  segment text not null default 'consumer'
    check (segment in ('consumer','pro','school','clinic','creator','employer','licensing','workshop','other')),
  amount_usd numeric(12,2) not null,
  probability numeric(4,2) not null default 1 check (probability >= 0 and probability <= 1),
  description text not null,
  evidence_url text,
  owner_email text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists growth_revenue_checkpoints_date_idx on growth_revenue_checkpoints(checkpoint_date desc);
create index if not exists growth_revenue_checkpoints_type_idx on growth_revenue_checkpoints(revenue_type, segment);

create table if not exists growth_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_hash text not null unique,
  segment text not null default 'parent'
    check (segment in ('parent','creator','preschool','clinic','employer','partner','other')),
  lead_magnet text not null default 'unknown',
  source text not null default 'marketing-site',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  consent_marketing boolean not null default true,
  status text not null default 'new'
    check (status in ('new','nurture','qualified','demo_requested','converted','unsubscribed','suppressed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_leads_segment_idx on growth_leads(segment, status);
create index if not exists growth_leads_created_idx on growth_leads(created_at desc);

create table if not exists growth_icp_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  segment text not null,
  priority integer not null default 3 check (priority between 1 and 5),
  pain_points jsonb not null default '[]'::jsonb,
  buying_triggers jsonb not null default '[]'::jsonb,
  positioning text not null,
  disallowed_claims jsonb not null default '[]'::jsonb,
  score_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_icp_definitions_segment_idx on growth_icp_definitions(segment, priority);

create table if not exists growth_opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  segment text not null default 'partner',
  country text,
  source_url text,
  contact_email text,
  estimated_value_usd numeric(12,2) not null default 0,
  stage text not null default 'research'
    check (stage in ('research','qualified','drafted','approved','contacted','demo_booked','proposal','won','lost','paused')),
  priority integer not null default 3 check (priority between 1 and 5),
  compliance_state text not null default 'needs_review'
    check (compliance_state in ('needs_review','approved','opted_out','blocked')),
  next_action text,
  next_action_at timestamptz,
  owner_email text,
  agent_rationale text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_opportunities_stage_idx on growth_opportunities(stage, priority);
create index if not exists growth_opportunities_next_action_idx on growth_opportunities(next_action_at);

create table if not exists growth_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null
    check (channel in ('email','social','webinar','partner','creator','paid','seo','community','appstore','other')),
  status text not null default 'draft'
    check (status in ('draft','approval_required','approved','scheduled','running','paused','completed','cancelled')),
  audience text not null,
  offer text not null,
  hypothesis text,
  success_metric text,
  fail_metric text,
  starts_at timestamptz,
  ends_at timestamptz,
  owner_email text,
  dry_run_required boolean not null default true,
  approval_required boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_campaigns_status_idx on growth_campaigns(status, channel);

create table if not exists growth_approval_queue (
  id uuid primary key default gen_random_uuid(),
  item_type text not null
    check (item_type in ('campaign','outreach','social_post','email','partner_proposal','agent_action','workflow_run')),
  item_id uuid,
  title text not null,
  risk_level text not null default 'medium'
    check (risk_level in ('low','medium','high','critical')),
  channel text,
  audience text,
  draft_payload jsonb not null default '{}'::jsonb,
  compliance_notes text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','changes_requested','expired')),
  requested_by text not null default 'system',
  approved_by uuid references auth.users(id),
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists growth_approval_queue_status_idx on growth_approval_queue(status, risk_level, created_at desc);

create table if not exists growth_readiness_scores (
  id uuid primary key default gen_random_uuid(),
  subsystem text not null unique,
  score integer not null check (score between 0 and 100),
  status text not null default 'needs_work'
    check (status in ('blocked','needs_work','ready','excellent')),
  p0_open integer not null default 0 check (p0_open >= 0),
  p1_open integer not null default 0 check (p1_open >= 0),
  last_verified_at timestamptz,
  checklist jsonb not null default '{}'::jsonb,
  notes text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
create index if not exists growth_readiness_scores_score_idx on growth_readiness_scores(score);

create table if not exists growth_kill_switches (
  key text primary key,
  label text not null,
  description text,
  enabled boolean not null default false,
  scope text not null default 'global'
    check (scope in ('global','channel','campaign','agent','provider','workflow')),
  reason text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists growth_compliance_suppression (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  value_hash text not null,
  value_label text,
  reason text not null,
  source text not null default 'manual',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(channel, value_hash)
);
create index if not exists growth_compliance_suppression_channel_idx on growth_compliance_suppression(channel);

create table if not exists growth_agent_briefs (
  id uuid primary key default gen_random_uuid(),
  brief_date date not null default current_date,
  agent text not null default 'hermes',
  brief_type text not null default 'daily'
    check (brief_type in ('daily','weekly','recovery','experiment','market_intel')),
  okr_id uuid references growth_daily_okrs(id) on delete set null,
  okr_score numeric(4,2),
  revenue_target_usd numeric(12,2) not null default 0,
  revenue_actual_usd numeric(12,2) not null default 0,
  biggest_win text,
  biggest_miss text,
  top_objection text,
  conversion_bottleneck text,
  product_risk text,
  recommended_objective text,
  experiments jsonb not null default '[]'::jsonb,
  stop_doing jsonb not null default '[]'::jsonb,
  recovery_action text,
  status text not null default 'draft'
    check (status in ('draft','reviewed','accepted','archived')),
  created_at timestamptz not null default now()
);
create index if not exists growth_agent_briefs_date_idx on growth_agent_briefs(brief_date desc, brief_type);

create table if not exists growth_experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null
    check (category in ('pricing','paywall','landing_page','creator','partner','content_hook','printable','webinar','retention','other')),
  hypothesis text not null,
  audience text not null,
  offer text not null,
  channel text not null,
  success_metric text not null,
  fail_metric text not null,
  status text not null default 'planned'
    check (status in ('planned','running','scale','iterate','kill','completed')),
  started_at timestamptz,
  decision_due_at timestamptz,
  decision text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_experiments_status_idx on growth_experiments(status, decision_due_at);

create table if not exists growth_revenue_sources (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  category text not null,
  segment text not null,
  offer text not null,
  target_price text,
  hypothesis text not null,
  success_metric text not null,
  fail_metric text not null,
  status text not null default 'planned'
    check (status in ('planned','testing','scale','iterate','kill','paused','completed')),
  evidence jsonb not null default '[]'::jsonb,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists growth_revenue_sources_status_idx on growth_revenue_sources(status, category);

create table if not exists growth_automation_runs (
  id uuid primary key default gen_random_uuid(),
  system text not null check (system in ('n8n','mautic','postiz','hermes','admin','other')),
  workflow_key text not null,
  status text not null default 'dry_run'
    check (status in ('dry_run','queued','running','succeeded','failed','blocked','cancelled')),
  dry_run boolean not null default true,
  approval_id uuid references growth_approval_queue(id) on delete set null,
  cost_usd numeric(10,4) not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists growth_automation_runs_status_idx on growth_automation_runs(system, status, created_at desc);

alter table growth_daily_okrs enable row level security;
alter table growth_key_results enable row level security;
alter table growth_revenue_checkpoints enable row level security;
alter table growth_leads enable row level security;
alter table growth_icp_definitions enable row level security;
alter table growth_opportunities enable row level security;
alter table growth_campaigns enable row level security;
alter table growth_approval_queue enable row level security;
alter table growth_readiness_scores enable row level security;
alter table growth_kill_switches enable row level security;
alter table growth_compliance_suppression enable row level security;
alter table growth_agent_briefs enable row level security;
alter table growth_experiments enable row level security;
alter table growth_revenue_sources enable row level security;
alter table growth_automation_runs enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'growth_daily_okrs',
    'growth_key_results',
    'growth_revenue_checkpoints',
    'growth_leads',
    'growth_icp_definitions',
    'growth_opportunities',
    'growth_campaigns',
    'growth_approval_queue',
    'growth_readiness_scores',
    'growth_kill_switches',
    'growth_compliance_suppression',
    'growth_agent_briefs',
    'growth_experiments',
    'growth_revenue_sources',
    'growth_automation_runs'
  ]) loop
    execute format('drop policy if exists %I_admin_read on public.%I', t, t);
    execute format('create policy %I_admin_read on public.%I for select using (is_admin(''marketing''))', t, t);
    execute format('drop policy if exists %I_admin_write on public.%I', t, t);
    execute format('create policy %I_admin_write on public.%I for all using (is_admin(''marketing'')) with check (is_admin(''marketing''))', t, t);
  end loop;
end $$;

insert into growth_kill_switches(key, label, description, scope)
values
  ('global_marketing_pause', 'Global marketing pause', 'Stops all outbound marketing automation and publishing.', 'global'),
  ('force_manual_approval', 'Force manual approval', 'Requires human approval for every campaign, post, email, workflow run, and agent action.', 'global'),
  ('cold_outreach_pause', 'Cold outreach pause', 'Blocks cold email/DM workflow execution while keeping research and drafts enabled.', 'channel'),
  ('social_publishing_pause', 'Social publishing pause', 'Blocks Postiz and social publishing workflows.', 'channel'),
  ('hermes_agent_pause', 'Hermes agent pause', 'Stops scheduled Hermes agent runs except manual admin-triggered dry runs.', 'agent'),
  ('paid_traffic_pause', 'Paid traffic pause', 'Blocks paid campaign launches while conversion or production risk is unresolved.', 'channel')
on conflict (key) do nothing;

insert into growth_readiness_scores(subsystem, score, status, notes, checklist)
values
  ('app_funnel', 70, 'needs_work', 'Verify onboarding, paywall, checkout, activity completion, and printable preview before scale.', '{"fallback": true, "observability": true, "manual_smoke_required": true}'::jsonb),
  ('paywall_checkout', 60, 'needs_work', 'Resolve app/marketing pricing conflict and run a payment smoke test.', '{"pricing_aligned": false, "payment_smoke_test": false}'::jsonb),
  ('admin_growth_command_center', 50, 'needs_work', 'Initial command center schema and APIs required before live operations.', '{"schema": true, "ui": false, "alerts": false}'::jsonb),
  ('mautic', 30, 'blocked', 'External deployment and email authentication are required.', '{"configured": false, "dkim_spf_dmarc": false, "backup": false}'::jsonb),
  ('n8n_workflows', 65, 'needs_work', 'Existing workflows must be wrapped in dry-run, approval, and audit controls.', '{"dry_run": false, "approval_gate": false, "audit": false}'::jsonb),
  ('postiz_publishing', 70, 'needs_work', 'Postiz exists but must respect global/channel kill switches.', '{"proxy": true, "kill_switch": false}'::jsonb),
  ('hermes_agent', 25, 'blocked', 'Agent profile and scheduled dry-run briefs need to be added before use.', '{"prompt": false, "dry_run": true, "approval_only": true}'::jsonb),
  ('compliance_suppression', 75, 'needs_work', 'Suppression table exists; external sync and pre-send checks must be enforced.', '{"table": true, "pre_send_check": false}'::jsonb),
  ('monitoring_alerts', 60, 'needs_work', 'Admin health exists; alert delivery requires production credentials.', '{"admin_visible": true, "alerts_configured": false}'::jsonb)
on conflict (subsystem) do nothing;

insert into growth_icp_definitions(key, name, segment, priority, pain_points, buying_triggers, positioning, disallowed_claims, score_rules)
values
  ('parents_enrichment_3_8', 'Parents already paying for enrichment, tutoring, Montessori, STEM, homeschool, speech/OT support, or parenting courses', 'parent', 1,
   '["wants practical at-home activities","worries about screen time","needs routines that fit busy days","values development without diagnosis"]'::jsonb,
   '["downloaded starter pack","asked about annual pricing","completed first activity","created printable guide","attended webinar"]'::jsonb,
   'AI-age readiness for kids, guided by parents through safe daily activities and printable routines.',
   '["diagnosis","guaranteed outcomes","medical treatment","brain training cure"]'::jsonb,
   '{"lead_score":{"starter_pack":10,"webinar":20,"checkout_start":30,"pro_interest":25},"fit_score":{"age_3_8":20,"already_pays":30,"routine_pain":20}}'::jsonb),
  ('preschool_montessori', 'Preschools and Montessori operators that want parent home-practice extension', 'school', 2,
   '["parents ask for home activities","teachers need take-home guides","schools want differentiation","limited staff time"]'::jsonb,
   '["requests pilot","asks about roster","asks about take-home guides","books demo"]'::jsonb,
   'A low-lift home-practice layer for families: printable guides, parent-led activities, and aggregate usage reporting.',
   '["child surveillance","diagnosis","teacher replacement","guaranteed school readiness"]'::jsonb,
   '{"lead_score":{"demo_booked":35,"pilot_interest":40,"multi_site":25},"fit_score":{"family_count_50_plus":30,"montessori":20,"parent_engagement_need":30}}'::jsonb),
  ('clinic_child_development', 'Pediatric clinics and child-development centers interested in parent observation snapshots', 'clinic', 3,
   '["parents need between-visit routines","clinics need concise parent observations","must avoid diagnostic overreach"]'::jsonb,
   '["asks about snapshot","reviews sample report","requests referral material"]'::jsonb,
   'Parent observation snapshots and daily activities that support conversations without making diagnosis claims.',
   '["diagnosis","clinical decision support","treatment recommendation","HIPAA claim without review"]'::jsonb,
   '{"lead_score":{"snapshot_interest":35,"sample_review":25,"pilot_proposal":40},"fit_score":{"family_volume":30,"parent_education":25,"trust_fit":30}}'::jsonb),
  ('employer_family_benefit', 'Employer family-benefit and wellbeing teams', 'employer', 4,
   '["working parents need support","benefits teams need low-lift family value","privacy boundaries are critical"]'::jsonb,
   '["asks about PEPM","requests aggregate reporting","books benefits demo"]'::jsonb,
   'A family wellbeing benefit that gives employees practical parent-led child development support without sharing child-level data.',
   '["employee child monitoring","medical claims","performance claims","child-level employer reports"]'::jsonb,
   '{"lead_score":{"benefits_demo":35,"pepm_interest":35,"proposal_request":40},"fit_score":{"employee_count":30,"family_benefit_budget":30,"privacy_fit":30}}'::jsonb)
on conflict (key) do nothing;

insert into growth_revenue_sources(key, name, category, segment, offer, target_price, hypothesis, success_metric, fail_metric)
values
  ('founder_family_annual', 'Founder Family Annual', 'subscription', 'parent', 'Annual family access', '$49-$79', 'Founder pricing converts activated parents faster than monthly pricing.', '2%+ week-one purchase rate from soft-launch users.', 'Under 1% purchase rate or poor activation.'),
  ('family_pro_annual', 'Family Pro Annual', 'subscription', 'parent', 'Printables, snapshots, coach memory, workshops', '$199-$299', 'High-intent parents will pay for deeper guidance and premium artifacts.', '10+ Pro purchases or strong founder-call demand.', 'No qualified Pro interest after 100 conversations.'),
  ('ai_age_challenge', '30-Day AI-Age Challenge', 'webinar', 'parent', 'Challenge plus annual/pro upsell', '$79-$299', 'Challenge framing increases completion and purchase intent.', '5%+ webinar-to-purchase conversion.', 'Low attendance or no checkout starts.'),
  ('printable_bundle_store', 'Printable Bundle Store', 'printables', 'parent', 'Standalone printable bundles', '$9-$49', 'Parents not ready for subscriptions will buy useful printable packs.', 'One-time purchases from non-subscribers.', 'No purchases after targeted email/social test.'),
  ('creator_affiliate', 'Creator Affiliate', 'affiliate', 'creator', 'Commission plus co-branded starter pack', '30%-50% commission', 'Trusted creators can acquire families with low cash CAC.', '5 creators publish and at least one converts.', 'Creators do not publish or traffic does not convert.'),
  ('preschool_pilot', 'Preschool Pilot', 'partner', 'school', '60-day family pilot', '$2,500', 'Schools will pay for a home-practice layer parents can use.', 'One paid pilot or serious procurement conversation.', 'No demo bookings after 100 qualified leads.'),
  ('clinic_snapshot_pilot', 'Clinic Snapshot Pilot', 'partner', 'clinic', 'Parent observation snapshot pilot', '$2,500-$10,000', 'Clinics value safe parent observations and routines.', 'Clinic agrees to review/share parent snapshot flow.', 'Compliance concerns block pilot.'),
  ('employer_benefit_pilot', 'Employer Benefit Pilot', 'enterprise', 'employer', 'Sponsored family benefit pilot', '$5,000-$15,000', 'Employers will sponsor family wellbeing support with strong privacy boundaries.', '10 HR conversations and one proposal.', 'No qualified HR interest.'),
  ('parent_workshop', 'Parent Workshop', 'workshop', 'parent', 'Paid AI-age readiness workshop', '$19-$49', 'Workshops convert education demand into cash and Pro upgrades.', '20 paid attendees or Pro conversions.', 'Low show-up or no purchases.'),
  ('coach_certification_waitlist', 'Coach Certification Waitlist', 'certification', 'creator', 'Certified NeuroSpark Guide waitlist', '$99-$499 later', 'Coaches want a structured AI-age readiness framework.', '50 qualified coach leads.', 'Low coach interest or compliance risk.'),
  ('ai_age_standard_licensing', 'AI-Age Standard Licensing', 'licensing', 'partner', 'API, badge, metadata licensing', '$99-$499/mo or $5k+ annual', 'Partners will license a portable AI-age framework.', 'Partner LOI or pilot payment.', 'No LOI after targeted partner outreach.'),
  ('marketplace_affiliate_bundle', 'Marketplace Affiliate Bundle', 'commerce', 'parent', 'Curated materials and printable bundles', 'affiliate commission', 'Parent-first materials curation increases ARPU and completion.', 'Legal-approved disclosure and positive conversion.', 'Trust/compliance risk or no conversion.')
on conflict (key) do nothing;

insert into growth_revenue_checkpoints(source, revenue_type, segment, amount_usd, probability, description, evidence_url)
values
  ('plan_seed', 'pipeline', 'consumer', 1000, 0.10, 'Milestone: first $1k revenue; proves first strangers pay.', 'docs/growth/LAUNCH_FOUNDATION.md'),
  ('plan_seed', 'pipeline', 'consumer', 10000, 0.10, 'Milestone: $10k revenue; validates founder offer.', 'docs/growth/REVENUE_SPRINT_PLAYBOOK.md'),
  ('plan_seed', 'pipeline', 'consumer', 50000, 0.08, 'Milestone: $50k revenue; one repeatable motion emerging.', 'docs/growth/REVENUE_SPRINT_PLAYBOOK.md'),
  ('plan_seed', 'pipeline', 'other', 100000, 0.06, 'Milestone: $100k cumulative revenue and global launch signal.', 'docs/growth/GLOBAL_SCALE_PLAYBOOK.md'),
  ('plan_seed', 'pipeline', 'other', 1000000, 0.03, 'Milestone: $1M cumulative revenue or predictable weekly channel.', 'docs/growth/GLOBAL_SCALE_PLAYBOOK.md'),
  ('plan_seed', 'pipeline', 'other', 10000000, 0.01, 'Milestone: $10M signed or collected revenue; pipeline alone does not count.', 'docs/growth/GLOBAL_SCALE_PLAYBOOK.md')
on conflict do nothing;

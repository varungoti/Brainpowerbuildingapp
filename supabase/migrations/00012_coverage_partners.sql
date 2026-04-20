-- ============================================================================
-- 00012_coverage_partners.sql
-- ----------------------------------------------------------------------------
-- Survivor 7: Coverage-as-a-Protocol.
-- Allows third-party experiences (Roblox plugins, daycare portals, sibling
-- co-play, grandparent SMS, school iPad apps) to grant brain-region +
-- AI-age-competency coverage credit to a child's profile via a signed,
-- rate-limited HTTPS API.
--
-- Tables:
--   coverage_partners    — registered partners with HMAC secret + caps
--   coverage_credits     — append-only ledger of credits granted
--   coverage_anon_links  — opaque per-child tokens partners use (no PII)
-- ============================================================================

create table if not exists public.coverage_partners (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  display_name    text not null,
  contact_email   text not null,
  -- HMAC-SHA256 secret used to sign credit requests. Stored as bytea so we
  -- never accidentally surface it in JSON/HTTP responses.
  signing_secret  bytea not null,
  -- Daily cap on minutes credited per child by this partner.
  daily_minutes_cap_per_child int not null default 60,
  -- Per-partner rate-limit (requests per minute, all-children).
  rpm_limit       int not null default 600,
  -- Disabled partners are kept for audit but their requests are rejected.
  disabled_at     timestamptz,
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  notes           text
);

create index if not exists coverage_partners_active_idx on public.coverage_partners(disabled_at);

-- Append-only ledger.
create table if not exists public.coverage_credits (
  id                   bigserial primary key,
  partner_id           uuid not null references public.coverage_partners(id) on delete cascade,
  child_id             text not null,
  -- Idempotency key — partners replay the same key on retries.
  partner_event_id     text not null,
  duration_seconds     int not null check (duration_seconds between 1 and 7200),
  -- 15-region brain map taxonomy (matches src/app/data/brainRegions.ts).
  brain_region         text,
  -- 12 AI-age competency IDs (matches packages/neurospark-ai-age spec).
  competency_ids       text[] not null default '{}',
  -- Modality from the open standard.
  modality             text not null,
  signed_at            timestamptz not null default now(),
  ip                   inet,
  unique (partner_id, partner_event_id)
);

create index if not exists coverage_credits_child_idx on public.coverage_credits(child_id, signed_at desc);
create index if not exists coverage_credits_partner_idx on public.coverage_credits(partner_id, signed_at desc);

-- Opaque tokens partners use to refer to a child without ever seeing PII.
create table if not exists public.coverage_anon_links (
  partner_id   uuid not null references public.coverage_partners(id) on delete cascade,
  anon_token   text not null,
  child_id     text not null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (partner_id, anon_token)
);
create index if not exists coverage_anon_links_user_idx on public.coverage_anon_links(user_id);
create index if not exists coverage_anon_links_child_idx on public.coverage_anon_links(child_id);

-- RLS: partners table is admin-only; credits readable by the owning user;
-- anon links readable by the owning user.
alter table public.coverage_partners enable row level security;
alter table public.coverage_credits enable row level security;
alter table public.coverage_anon_links enable row level security;

create policy "coverage_partners_admin_select"
  on public.coverage_partners for select to authenticated
  using (is_admin('readonly'));
create policy "coverage_partners_admin_modify"
  on public.coverage_partners for all to authenticated
  using (is_admin('superadmin'))
  with check (is_admin('superadmin'));

create policy "coverage_credits_self_select"
  on public.coverage_credits for select to authenticated
  using (
    exists (
      select 1 from public.coverage_anon_links l
      where l.child_id = coverage_credits.child_id
        and l.user_id = auth.uid()
    )
    or is_admin('readonly')
  );

create policy "coverage_anon_links_self"
  on public.coverage_anon_links for all to authenticated
  using (user_id = auth.uid() or is_admin('readonly'))
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.coverage_partners to authenticated;
grant select on public.coverage_credits to authenticated;
grant select, insert, delete on public.coverage_anon_links to authenticated;
grant usage, select on sequence coverage_credits_id_seq to authenticated;

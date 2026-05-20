-- Gamified Mission HQ: per-admin checklist completion (XP, streaks) for operator motivation.

create table if not exists admin_mission_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_key text not null,
  completed_at timestamptz not null default now(),
  xp_awarded integer not null check (xp_awarded >= 0 and xp_awarded <= 10000),
  primary key (user_id, mission_key)
);

create index if not exists admin_mission_completions_user_completed_idx
  on admin_mission_completions (user_id, completed_at desc);

comment on table admin_mission_completions is
  'Admin Mission HQ progress; written only via Edge /admin/missions with service role.';

alter table admin_mission_completions enable row level security;

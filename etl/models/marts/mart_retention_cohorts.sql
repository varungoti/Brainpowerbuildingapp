-- Weekly cohort retention (W0..W12).
-- Cohort = first week a profile fired any event.
with first_seen as (
  select profile_id, min(event_date) as first_event_date
  from {{ ref('stg_events') }}
  group by 1
),
weeks as (
  select
    profile_id,
    date_trunc('week', first_event_date)::date as cohort_week,
    date_trunc('week', occurred_at)::date     as activity_week
  from {{ ref('stg_events') }} e
  join first_seen using (profile_id)
)
select
  cohort_week,
  ((extract(epoch from activity_week - cohort_week) / 86400 / 7))::int as week_offset,
  count(distinct profile_id) as active_profiles,
  (count(distinct profile_id)::numeric
    / nullif(max(count(distinct profile_id)) over (partition by cohort_week), 0))
    as retention_rate
from weeks
where activity_week >= cohort_week
  and activity_week <= cohort_week + interval '12 weeks'
group by 1, 2
order by 1, 2

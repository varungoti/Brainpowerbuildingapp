with subs as (select * from {{ source('raw', 'subscriptions') }}),
events as (select * from {{ ref('stg_events') }})
select
  date_trunc('day', subs.created_at)::date as cohort_day,
  count(*) filter (where subs.status = 'trialing')   as trials_started,
  count(*) filter (where subs.status = 'active')     as conversions,
  count(*) filter (where subs.status = 'cancelled')  as churns,
  sum(case when subs.plan = 'family' then 12.0
           when subs.plan = 'pro'    then 6.0
           when subs.plan = 'starter' then 2.0
           else 0 end)                                as mrr_added_usd
from subs
group by 1
order by 1

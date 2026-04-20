with daily as (
  select event_date, count(distinct profile_id) as dau
  from {{ ref('stg_events') }}
  where event_date >= current_date - interval '180 days'
  group by 1
)
select
  event_date,
  dau,
  avg(dau) over (order by event_date rows between 6 preceding and current row)  as dau_7d_avg,
  avg(dau) over (order by event_date rows between 27 preceding and current row) as dau_28d_avg
from daily
order by event_date

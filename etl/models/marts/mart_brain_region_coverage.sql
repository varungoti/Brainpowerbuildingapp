-- For each child, percentage of the 15-region brain map covered in last 30 days.
with attempts as (
  select child_id, brain_regions
  from {{ ref('stg_attempts') }}
  where occurred_at >= current_date - interval '30 days'
),
exploded as (
  select child_id, jsonb_array_elements_text(brain_regions) as region
  from attempts
  where brain_regions is not null
),
per_child as (
  select child_id, count(distinct region) as regions_touched
  from exploded
  group by 1
)
select
  child_id,
  regions_touched,
  round((regions_touched::numeric / 15) * 100, 1) as coverage_pct
from per_child
order by coverage_pct desc

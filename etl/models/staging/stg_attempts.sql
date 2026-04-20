with src as (select * from {{ source('raw', 'activity_attempts') }})
select
  id,
  child_id::uuid as child_id,
  activity_id,
  rating::int    as rating,
  duration_sec::int as duration_sec,
  occurred_at::timestamp as occurred_at,
  date_trunc('day', occurred_at)::date as event_date,
  brain_regions  as brain_regions,         -- jsonb array
  competencies   as competencies           -- jsonb array (AI-age framework)
from src

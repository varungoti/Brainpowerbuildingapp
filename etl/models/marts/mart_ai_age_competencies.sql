-- AI-age competency progress per child per week.
with attempts as (
  select child_id,
         date_trunc('week', occurred_at)::date as week,
         jsonb_array_elements_text(competencies) as competency
  from {{ ref('stg_attempts') }}
  where competencies is not null
)
select
  child_id,
  week,
  competency,
  count(*) as attempts
from attempts
group by 1, 2, 3
order by child_id, week, competency

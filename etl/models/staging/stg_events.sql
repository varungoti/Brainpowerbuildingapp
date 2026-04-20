with src as (
  select * from {{ source('raw', 'events') }}
)
select
  id,
  occurred_at::timestamp                                         as occurred_at,
  date_trunc('day', occurred_at)::date                            as event_date,
  profile_id::uuid                                                as profile_id,
  child_id::uuid                                                  as child_id,
  name,
  coalesce(payload->>'utm_source', payload->>'ns_source')         as utm_source,
  coalesce(payload->>'utm_medium', payload->>'ns_medium')         as utm_medium,
  coalesce(payload->>'utm_campaign', payload->>'ns_campaign')     as utm_campaign,
  payload->>'platform'                                            as platform,
  payload
from src

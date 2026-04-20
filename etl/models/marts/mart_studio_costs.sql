select
  date_trunc('day', occurred_at)::date as day,
  service,
  provider,
  count(*)                       as jobs,
  sum(cost_usd)                  as cost_usd
from {{ source('raw', 'studio_cost_ledger') }}
where occurred_at >= current_date - interval '90 days'
group by 1, 2, 3
order by 1 desc, cost_usd desc

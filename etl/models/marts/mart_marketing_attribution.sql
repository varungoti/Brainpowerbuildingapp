-- Last-touch attribution: for each acquired profile, what utm_source got them in?
with first_touch as (
  select profile_id,
         (array_agg(utm_source order by occurred_at) filter (where utm_source is not null))[1] as first_source,
         (array_agg(utm_medium order by occurred_at) filter (where utm_medium is not null))[1] as first_medium,
         (array_agg(utm_campaign order by occurred_at) filter (where utm_campaign is not null))[1] as first_campaign,
         min(occurred_at) as acquired_at
  from {{ ref('stg_events') }}
  group by profile_id
),
costs as (
  select source, medium, campaign,
         sum(spend_usd) as spend_usd
  from {{ source('raw', 'marketing_costs') }}
  group by 1,2,3
)
select
  coalesce(first_source, 'organic')  as source,
  coalesce(first_medium, 'organic')  as medium,
  coalesce(first_campaign, 'none')   as campaign,
  count(*)                            as acquired_profiles,
  coalesce(c.spend_usd, 0)            as spend_usd,
  case when count(*) > 0 then coalesce(c.spend_usd, 0) / count(*) end as cac
from first_touch t
left join costs c
  on coalesce(t.first_source, 'organic')   = c.source
 and coalesce(t.first_medium, 'organic')   = c.medium
 and coalesce(t.first_campaign, 'none')    = c.campaign
group by 1,2,3, c.spend_usd
order by acquired_profiles desc

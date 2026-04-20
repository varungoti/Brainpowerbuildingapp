# NeuroSpark ETL & Analytics Marts

Nightly pipeline:

1. `sync_supabase.py` mirrors Supabase tables → Neon `raw.*` schema (full
   refresh for slow-moving tables, incremental upsert for events/attempts).
2. `dbt run` materialises staging views + marts in Neon.
3. `dbt test` verifies row counts + uniqueness.

Marts produced:

| Mart | Purpose |
| --- | --- |
| `mart_dau` | Daily Active Users with 7d / 28d rolling averages |
| `mart_retention_cohorts` | Weekly retention curves (W0..W12) per cohort |
| `mart_brain_region_coverage` | % of 15-region brain map covered per child (last 30d) |
| `mart_ai_age_competencies` | AI-age competency progress per child per week |
| `mart_subscriptions_funnel` | Trial → conversion → churn funnel |
| `mart_marketing_attribution` | First-touch CAC by source / medium / campaign |
| `mart_studio_costs` | AI generation spend per provider per day |

## Local run

```bash
cd etl
cp .env.example .env   # fill SOURCE_PG_URL + TARGET_NEON_URL
pip install -r requirements.txt
python sync_supabase.py
dbt deps && dbt run && dbt test
```

## CI

Wired in `.github/workflows/analytics-nightly.yml` (cron: 02:00 UTC).
Runs sync + dbt build on every push to `main`, plus nightly. Posts a Slack
message on failure.

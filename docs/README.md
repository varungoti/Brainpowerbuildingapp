# NeuroSpark documentation index

| Document | Description |
|----------|-------------|
| [MASTER_DEVELOPMENT_PLAN.md](./MASTER_DEVELOPMENT_PLAN.md) | Exhaustive product/engineering roadmap, research pillars, workstreams, metrics |
| [BUILD_PLAN_REPORT.md](./BUILD_PLAN_REPORT.md) | Codebase inventory vs ambition; phased build; technical checklist |
| [AGENT_SELF_IMPROVEMENT_AND_QUALITY_SYSTEM.md](./AGENT_SELF_IMPROVEMENT_AND_QUALITY_SYSTEM.md) | NDEQ: scored domains, experiment bursts, adoption gates |
| [rubrics/DELIVERABLE_SCORECARD.md](./rubrics/DELIVERABLE_SCORECARD.md) | 0–5 rubric (D1–D8) for PRs and content |
| [EXPERIMENT_LOG.md](./EXPERIMENT_LOG.md) | Running experiment log + domain score table |
| [SUPABASE_AUTH.md](./SUPABASE_AUTH.md) | Optional real sign-in with Supabase |
| [SUPABASE_SCHEMA_PLAN.md](./SUPABASE_SCHEMA_PLAN.md) | Draft tables, RLS pattern, sync checklist |
| In-app **Legal & Trust** | Profile → “Legal, privacy & AI notice” (`legal_info`) — draft copy until counsel review |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | A11y baseline + backlog (contrast, touch targets) |
| [PRODUCT_ANALYTICS.md](./PRODUCT_ANALYTICS.md) | Privacy-light funnel events + optional `VITE_ANALYTICS_ENDPOINT` |
| [COPPA_GDPR_CHECKLIST.md](./COPPA_GDPR_CHECKLIST.md) | Pre-marketing compliance checklist (not legal advice) |
| [ENVIRONMENT_AND_STAGING.md](./ENVIRONMENT_AND_STAGING.md) | `VITE_*` vars, local/preview/staging vs prod, CI |
| [ERROR_MONITORING.md](./ERROR_MONITORING.md) | Optional Sentry (`VITE_SENTRY_DSN`), privacy defaults |
| [DATA_SYNC_AND_BACKUP.md](./DATA_SYNC_AND_BACKUP.md) | Local backup JSON, future cloud import notes |
| [CONTENT_EDITORIAL_WORKFLOW.md](./CONTENT_EDITORIAL_WORKFLOW.md) | How to add/review activities safely |
| [PWA_OFFLINE.md](./PWA_OFFLINE.md) | Install flow, service worker, offline behavior |
| [CONTENT_MEDIA_ORCHESTRATION.md](./CONTENT_MEDIA_ORCHESTRATION.md) | Prompt/media packets, validation, provider-neutral config |
| [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) | Pre-launch engineering and product checks |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | Privacy/security model, mitigations, residual risks |
| [PERFORMANCE_BUDGET.md](./PERFORMANCE_BUDGET.md) | Bundle targets and regression triggers |
| [MOAT_STRATEGY.md](./MOAT_STRATEGY.md) | Defensibility through curriculum, personalization, and trust |
| [LEGAL_PUBLISHING_CHECKLIST.md](./LEGAL_PUBLISHING_CHECKLIST.md) | Counsel handoff: policies, paywall alignment, COPPA cross-check |

**Environment:** See repo root `.env.example` for Supabase client vars.

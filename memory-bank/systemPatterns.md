# System Patterns

## Application architecture
- Single-page React/Vite app.
- Primary app state lives in `AppContext`.
- Views are switched through `AppView`; navigation must remain additive and non-destructive.

## Persistence patterns
- Local-first state in `localStorage` under `neurospark_v2`.
- Separate Supabase auth storage key for session isolation.
- JSON backup/export acts as today’s portable sync artifact.

## Reliability patterns
- `pnpm run verify` is the main local quality gate.
- `pnpm run verify:full` extends the gate with Playwright coverage.
- `pnpm run content:validate` and `pnpm run age:report` validate content/media quality and AGE behavior.
- ErrorBoundary wraps the app; optional Sentry is DSN-gated and production-only.

## Backend patterns
- Supabase Edge function hosts AI/payments/analytics handlers.
- Analytics ingest is privacy-light and event-allowlisted.
- Future Postgres sync and RLS are planned via sketch migrations/docs.

## Product patterns
- AGE balances personalization with diversity and anti-repeat logic.
- AGE now supports bounded outcome-pillar emphasis from recent checklist data.
- Activities are enriched with reviewed metadata, milestone links, goal pillars, and progression hooks.
- Year plan weeks can be linked to real activity ids for more executable curriculum mapping.
- Legal/privacy and AI disclaimers are in-product and draft-oriented until counsel review.

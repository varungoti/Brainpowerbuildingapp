# System Patterns

## Architecture

- The Vite/Capacitor app calls Supabase Edge Functions for server-side AI work.
- AI provider keys belong in Edge Function secrets or automation service env vars, not `VITE_*` variables.
- Existing AI routes live mainly in `supabase/functions/server/index.tsx`.
- Existing deterministic fallbacks live in app/shared modules such as `src/lib/coach/generateCoachPrompt.ts` and the static activity catalog.
- Studio and image/video automation already use a `studio_cost_ledger` cost table and provider abstraction patterns.

## Preferred Patterns

- Add shared provider modules instead of duplicating raw provider fetch calls.
- Validate model output with explicit schemas and normalization before UI rendering.
- Cache expensive generated artifacts by stable hashes where possible.
- Treat image generation as optional enrichment with icon/shape fallbacks.
- Use existing design language: gradients, rounded cards, intelligence colors, competency badges, and accessible contrast helpers.

## Guardrails

- Do not remove or orphan existing `AppView` routes.
- Do not replace deterministic pack selection with LLM-only behavior.
- Generated printables should enrich `runAGE()` packs, not make pack generation dependent on external AI.
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

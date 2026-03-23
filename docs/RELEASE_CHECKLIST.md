# Release Checklist

Use this before any serious staging or production handoff.

## Code quality gates

- Run `pnpm install`
- Run `pnpm run verify`
- Run `pnpm run content:validate`
- Run `pnpm run age:report`
- Run `pnpm run test:e2e`
- Run `pnpm run verify:full`
- Confirm CI passed `typecheck`, `lint`, `test`, `content:validate`, `age:report`, `build`, and Playwright E2E.

## Product readiness

- Confirm onboarding, generator, activity detail, backup tools, and profile install flow still work.
- Confirm milestone completion persists and the milestone-to-progress tracker updates correctly.
- Confirm offline banner, AI Counselor offline state, and paywall offline state are understandable.
- Confirm `activity_detail` remains reachable from generated activities.
- Confirm legal/privacy screens still render and match current draft policy language.

## Environment & observability

- Verify `.env` is local-only and based on `.env.example`.
- If using Sentry, confirm DSN is production-only and privacy defaults remain unchanged.
- If using analytics, confirm endpoint is allowlisted and still privacy-light.

## Content & curriculum

- Validate new or edited activities have reviewed metadata.
- Review any prompt packets/media blueprints before external generation.
- Inspect AGE report output for diversity, duration, and pillar-hit anomalies.

## Launch blockers

- Missing secrets or external accounts
- Counsel-required policy changes not yet applied
- Payment provider configuration not confirmed
- Any failing verification or unexplained build-size regression

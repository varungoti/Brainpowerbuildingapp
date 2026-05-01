# Tech Context

## Stack

- Frontend: React 18, Vite, TypeScript, Tailwind-style utility classes.
- Mobile: Capacitor Android/iOS.
- Server: Supabase Edge Functions with Hono-style routing.
- Data: Supabase Postgres, KV fallback in some Edge paths.
- Tests: Vitest, Playwright, TypeScript typecheck, ESLint.
- Package manager: pnpm.

## AI And Media

- Current text AI calls use OpenAI-compatible chat completions in Edge routes.
- Fireworks.ai is OpenAI-compatible for chat completions and supports structured JSON outputs.
- Fireworks image generation can use FLUX.1 schnell workflow endpoints.
- Existing image automation lives in `automation/image-svc`.
- Existing content validation lives in `scripts/content-validate.ts`.

## Verification

Standard verification after substantive edits:

- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run content:validate`
- `pnpm run age:report`
- `pnpm run build`
- `pnpm run verify`

For native-impacting changes, also run mobile sync and Android debug build.
# Tech Context

## Stack
- React + TypeScript + Vite
- Vitest for unit tests
- Playwright for E2E smoke/core flows
- Supabase JS client for optional auth
- Supabase Edge functions for server-side endpoints
- Service worker + manifest-based PWA shell
- `tsx` scripts for AGE/content validation reporting

## Environment assumptions
- Windows development environment
- `pnpm` package manager
- Optional `VITE_*` variables for Supabase, analytics, and Sentry

## Key operational rules
- No external secrets or interactive logins without user involvement.
- Avoid destructive git operations.
- Prefer privacy-forward defaults and minimal child-linked data collection.

## Quality gates
- `pnpm run verify`
- `pnpm run test:e2e`
- `pnpm run verify:full`
- `pnpm run age:report`
- `pnpm run content:validate`

## Current repo additions already present
- Product analytics
- COPPA/GDPR engineering checklist
- Error monitoring doc and optional Sentry
- Backup/import flow and RLS planning sketches
- Offline/PWA install flow
- Content/media orchestration scaffolding

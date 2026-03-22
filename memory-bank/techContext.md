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

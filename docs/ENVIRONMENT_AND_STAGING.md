# Environment variables & staging

## Quick reference

| Variable | Required | Used for |
|----------|----------|----------|
| `VITE_SUPABASE_PROJECT_ID` | For Edge + optional Auth | Supabase project URL (see `.env.example`) |
| `VITE_SUPABASE_ANON_KEY` | With project id | Client + Edge calls; analytics POST `Authorization` when endpoint set |
| `VITE_ANALYTICS_ENDPOINT` | No | Privacy-light funnel events (`docs/PRODUCT_ANALYTICS.md`) |
| `VITE_SENTRY_DSN` | No | Production-only client errors (`docs/ERROR_MONITORING.md`) |
| `VITE_APP_ENV` | No | Sentry “environment” tag (`production`, `staging`, …) |

Vite only exposes variables prefixed with **`VITE_`**. Never put service role keys or Razorpay secrets in the web bundle.

## Local development

1. Copy **`.env.example`** → **`.env`** in the repo root (gitignored).
2. `pnpm install` → `pnpm run dev` (Vite on default port; check terminal).
3. Quality gate before merge: **`pnpm run verify`** (typecheck, lint, unit tests, build).
4. Optional: **`pnpm run test:e2e`** after `pnpm exec playwright install chromium` once.

## Preview / static hosting

```bash
pnpm run build
pnpm exec vite preview --host 127.0.0.1 --port 4173
```

Use the same `.env` values **at build time** if the app must embed Supabase URL/key (current pattern). Rebuild when changing `VITE_*` vars.

## Staging vs production

| Concern | Staging | Production |
|--------|---------|------------|
| Supabase | Separate project or branch (`SUPABASE_SCHEMA_PLAN.md`) | Production project |
| `VITE_APP_ENV` | `staging` | `production` |
| `VITE_SENTRY_DSN` | Optional separate Sentry project | Production DSN |
| `VITE_ANALYTICS_ENDPOINT` | Staging sink or disabled | Production sink |

**CI:** `.github/workflows/ci.yml` runs typecheck, lint, tests, build, Playwright smoke. It does not deploy.

## Server-side (Supabase Edge)

AI counselor, Razorpay, and analytics rollup live under **`supabase/functions/server`**. Those secrets (e.g. `OPENAI_API_KEY`, Razorpay keys) are configured in the **Supabase dashboard** for the function — not in `VITE_*` vars.

## Related docs

- `docs/SUPABASE_AUTH.md` — optional email auth  
- `docs/PRODUCT_ANALYTICS.md` — analytics payload & endpoint  
- `docs/ERROR_MONITORING.md` — Sentry behavior  
- `docs/COPPA_GDPR_CHECKLIST.md` — before collecting or shipping more data  

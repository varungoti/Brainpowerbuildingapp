# Brain Power Building App (NeuroSpark)

This is a code bundle for Brain Power Building App. The original project is available at https://www.figma.com/design/8n4lLSuoVpk9aOCvTDkAIb/Brain-Power-Building-App.

## Install & run (use **pnpm**, not npm)

This project is locked with **`pnpm-lock.yaml`**. Dependencies (including `@supabase/supabase-js`) are already declared in `package.json` — you do **not** need a separate `npm install @supabase/supabase-js`.

1. Install [pnpm](https://pnpm.io/installation) if needed (`npm install -g pnpm`).
2. From the project folder:

```bash
pnpm install
pnpm run dev
```

Other commands: `pnpm run build`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, **`pnpm run verify`** (typecheck + lint + tests + build), **`pnpm run verify:full`** (verify + Playwright), **`pnpm run test:e2e`** (Playwright smoke/core flows; installs Chromium via `pnpm exec playwright install chromium` once), **`pnpm run age:report`** (AGE simulation summary), **`pnpm run content:validate`** (review metadata + media prompt checks). CI runs verify + E2E on push/PR (GitHub Actions).

**Why not `npm install`?** Using npm here often fails or corrupts `node_modules` because the repo is maintained for pnpm. Errors like `Cannot read properties of null (reading 'matches')` are common npm bugs in that situation.

**Optional env:** Copy `.env.example` → `.env` for Supabase (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`). Optional funnel sink: `VITE_ANALYTICS_ENDPOINT` (see `docs/PRODUCT_ANALYTICS.md`).

More docs: [`docs/README.md`](docs/README.md) · [Environment & staging](docs/ENVIRONMENT_AND_STAGING.md) · [PWA & offline](docs/PWA_OFFLINE.md) · [Content/media orchestration](docs/CONTENT_MEDIA_ORCHESTRATION.md) · [Threat model](docs/THREAT_MODEL.md) · [Release checklist](docs/RELEASE_CHECKLIST.md).
  
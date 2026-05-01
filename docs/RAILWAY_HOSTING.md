# Railway Hosting Runbook

This repo is ready to deploy three web services to Railway:

- Consumer app: repo root, `Dockerfile`, `railway.json`
- Admin app: `admin/Dockerfile`, `admin/railway.json`
- Marketing site: `marketing-site/Dockerfile`, `marketing-site/railway.json`

## CLI authentication (tokens)

Two different tokens exist on Railway; only one works with the CLI:

| Token kind | Where created | `pnpm run railway:cli whoami` | GraphQL `project(id)` |
|---|---|---|---|
| **Account API token** | [Account → API tokens](https://railway.com/account/tokens) | Works | Works |
| **Project token** | Project → Settings → Tokens (UUID-shaped) | **Unauthorized** | Works |

Workspace-scoped account tokens can also break the CLI ([issue #845](https://github.com/railwayapp/cli/issues/845)). Prefer a normal account token.

In `.env.local` (gitignored), set:

```text
RAILWAY_API_TOKEN=...account_token_from_account_settings...
RAILWAY_PROJECT_ID=55a53e74-31d8-4e15-84d9-ecf212214fbe
```

Check what you have (does not print secrets):

```bash
pnpm run railway:token-check
```

- Exit **0** — account token; CLI deploys work.
- Exit **2** — project token; replace with an account token, or deploy by **Git** from the dashboard instead of `railway up`.

Run the CLI via the loader so no stale `RAILWAY_*` from your shell overrides the token:

```bash
pnpm run railway:cli whoami
pnpm run railway:cli link -p 55a53e74-31d8-4e15-84d9-ecf212214fbe
```

### List project / environment / service IDs (GraphQL)

If you only have a project token, this still works:

```bash
node scripts/railway-list-project.mjs
```

## Suggested Railway Project

Create one Railway project:

```bash
railway login
railway init --name neurospark-production
```

Then create three services from the repo:

```bash
# Consumer app
railway up --service neurospark-app

# Admin app
cd admin
railway up --service neurospark-admin

# Marketing site
cd ../marketing-site
railway up --service neurospark-marketing
```

## Required Variables

Consumer app:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EDGE_BASE_URL=
VITE_ANALYTICS_ENDPOINT=
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=
VITE_FEATURE_FLAGS=
```

Admin app:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_EDGE_BASE_URL=
VITE_POSTIZ_FRONTEND_URL=
```

Marketing site:

```text
PUBLIC_APP_DOWNLOAD_IOS=
PUBLIC_APP_DOWNLOAD_ANDROID=
PUBLIC_APP_WEB_URL=
PUBLIC_GROWTH_LEAD_ENDPOINT=https://<edge-domain>/growth/lead
```

Supabase Edge Functions:

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ALLOWED_ORIGINS=https://<app-domain>,https://<admin-domain>,https://<marketing-domain>
FIREWORKS_API_KEY=
OPENAI_API_KEY=
AI_MONTHLY_USD_CAP=
REMOTE_CONFIG_JSON=
POSTIZ_BASE_URL=
POSTIZ_API_KEY=
POSTIZ_FRONTEND_URL=
```

## Deployment Order

1. Run `pnpm run growth:check`.
2. Run `pnpm run typecheck`.
3. Run `pnpm --filter @neurospark/admin build`.
4. Run `pnpm --filter marketing-site build`.
5. Apply Supabase migration `00016_growth_command_center.sql`.
6. Deploy Supabase Edge Function.
7. Deploy marketing site so `/ai-age-starter-pack` points to `/growth/lead`.
8. Deploy admin app and verify `/admin/growth`.
9. Deploy consumer app.
10. Keep outbound automation paused until the Growth Command Center production gate is green.

## Smoke Tests

- `GET /healthz` on every Railway service.
- Marketing: open `/pricing` and `/ai-age-starter-pack`.
- Lead capture: submit a test email and confirm it appears in Admin → `$10M Growth`.
- Admin: verify login, `$10M Growth`, kill switches, readiness, approval queue.
- Consumer app: onboarding → generate pack → paywall view → checkout disabled/enabled state.

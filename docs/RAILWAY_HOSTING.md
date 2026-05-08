# Railway Hosting Runbook

This repo is ready to deploy three web services to Railway:

- Consumer app: repo root, `Dockerfile`, `railway.json`
- Admin app: `admin/Dockerfile`, `admin/railway.json`
- Marketing site: `marketing-site/Dockerfile`, `marketing-site/railway.json`

## CLI authentication (tokens)

Preferred variable for an **account** token (from [Account → API tokens](https://railway.com/account/tokens) only):

```text
RAILWAY_ACCOUNT_API_TOKEN=...
```

Aliases still supported: `RAILWAY_API_TOKEN`, `RAILWAY_TOKEN`. Values are **normalized** (surrounding quotes removed so `"token"` in `.env.local` does not break Bearer auth).

Two token kinds:

| Token kind | Where created | `pnpm run railway:cli whoami` | GraphQL `project(id)` |
|---|---|---|---|
| **Account API token** | [Account → API tokens](https://railway.com/account/tokens) | Works | Works |
| **Project token** | Project → Settings → Tokens (UUID-shaped) | **Unauthorized** | Works |

Workspace-scoped account tokens can also break the CLI ([issue #845](https://github.com/railwayapp/cli/issues/845)). Prefer a normal account token (no workspace restriction if the CLI rejects it).

### Use `railway login` instead of a file token

If `railway whoami` works in your terminal after `railway login`, but `pnpm run railway:cli whoami` fails because `.env.local` contains a **project** token, either:

- Remove the file token and add:

```text
RAILWAY_CLI_USE_LINKED_LOGIN=true
```

so `scripts/railway-exec.mjs` does **not** inject `RAILWAY_TOKEN` from disk and the CLI uses `~/.railway` (same as plain `railway`); or

- Replace with a real **account** token as `RAILWAY_ACCOUNT_API_TOKEN`.

Use **one** of these patterns (not both a bad file token and linked login at once):

```text
# A) Account API token only (CI / MCP / pnpm railway:cli)
RAILWAY_ACCOUNT_API_TOKEN=...
RAILWAY_PROJECT_ID=55a53e74-31d8-4e15-84d9-ecf212214fbe
```

```text
# B) Linked `railway login` only — omit file tokens or they are ignored when this is set
RAILWAY_CLI_USE_LINKED_LOGIN=true
RAILWAY_PROJECT_ID=55a53e74-31d8-4e15-84d9-ecf212214fbe
```

Check (does not print secrets):

```bash
pnpm run railway:token-check
```

- Exit **0** — account token **or** linked-login mode is valid.
- Exit **2** — project / limited token for GraphQL; fix token or switch to linked login.

Run the CLI via the loader so no stale `RAILWAY_*` from your shell overrides auth:

```bash
pnpm run railway:cli whoami
pnpm run railway:cli link -p 55a53e74-31d8-4e15-84d9-ecf212214fbe
```

### Cursor Railway MCP (`user-railway`)

If the MCP server shows an error in Cursor Settings, set its environment to the **same account token** Railway documents for the API (not a project token). Use the env var name required by that MCP package—often `RAILWAY_API_TOKEN` or `RAILWAY_TOKEN`—with the value from [Account → API tokens](https://railway.com/account/tokens). MCP cannot use browser `railway login`; it needs a token string. This repo’s scripts prefer `RAILWAY_ACCOUNT_API_TOKEN` in `.env.local`; copy that value into the MCP server config if needed.

### List project / environment / service IDs (GraphQL)

Requires **any** token that can call `project(id)` (account or project token):

```bash
pnpm run railway:list-project
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

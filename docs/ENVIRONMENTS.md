# Environments (staging vs production)

For **exact variable names and Supabase/Razorpay secrets**, use **[SETUP_CREDENTIALS.md](./SETUP_CREDENTIALS.md)**.

## Principles

- **Never** commit real `.env` files. Use `.env.example` as the template.
- Use **separate Supabase projects** for staging and production so test data and keys never mix.
- **Rotate** keys if they leak; update hosting and CI secrets the same day.

## Typical variables

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `VITE_SUPABASE_PROJECT_ID` | Local / dev project URL | Staging project | Production project |
| `VITE_SUPABASE_ANON_KEY` | Dev anon key | Staging anon key | Production anon key |
| `VITE_SENTRY_DSN` | Empty or dev DSN | Staging DSN | Production DSN |
| `VITE_APP_ENV` | `development` | `staging` | `production` |
| `VITE_ADMIN_EMAILS` | Your email(s) or `VITE_BLUEPRINT_DEV_OPEN=true` locally | Team emails | Team emails only |
| `VITE_ANALYTICS_ENDPOINT` | Optional local tunnel | Staging endpoint | Production endpoint |
| `VITE_FEATURE_FLAGS` | As needed | e.g. experiments | e.g. `payments_remote_kill` for emergencies |

`VITE_APP_VERSION` is **injected at build** from `package.json` — do not set it in `.env`.

## Builds

- **Web:** `pnpm run build` with the target env vars exported or in `.env.production.local`.
- **Capacitor:** `pnpm run build:mobile` after setting env for that store build; run `cap sync` before opening Android Studio / Xcode.

## CI (GitHub Actions)

The workflow builds with `VITE_ADMIN_EMAILS` from repository **Secrets** (optional). Other Supabase keys are **not** required for CI unless you add a dedicated preview deployment job.

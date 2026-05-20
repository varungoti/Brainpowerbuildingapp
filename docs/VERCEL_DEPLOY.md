# Vercel deployment — NeuroSpark

Two separate Vercel projects (Vercel slugs are lowercase; set the **display name** to **NeuroSpark** in the dashboard):

| Vercel project slug | Display name (Settings → General) | What it hosts |
|---------------------|-----------------------------------|---------------|
| `neurospark` | **NeuroSpark** | Parent web app (`dist/` from repo root) |
| `neurospark-admin` | **NeuroSpark Admin** | Admin panel (`admin/dist/`) |

Team scope: `varubs-projects` (override with `VERCEL_SCOPE`).

## Environment variables

Set on each project in [Vercel → Project → Settings → Environment Variables](https://vercel.com):

**neurospark** (parent app):

- `VITE_SUPABASE_PROJECT_ID` — Supabase project URL or ref
- `VITE_SUPABASE_ANON_KEY` — anon key
- `VITE_ANALYTICS_ENDPOINT` — optional; edge function analytics URL

**neurospark-admin**:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MARKETING_OS_BASE` — optional override for Marketing OS function URL

Do **not** set `VITE_SHOW_DEMO_LOGIN` on production web builds.

**neurospark** (parent app) also needs:

- `VITE_ADMIN_EMAILS=varungoti@gmail.com` — unlocks in-app Blueprint / architecture docs for that email.

## Supabase Auth (required for admin magic link)

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**, add:

- **Site URL:** `https://neurospark-admin.vercel.app`
- **Redirect URLs:** `https://neurospark-admin.vercel.app`, `https://neurospark-admin.vercel.app/**`, `http://localhost:5174/**` (local admin dev)

Without this, OTP sign-in fails or redirects incorrectly.

## Grant superadmin (`varungoti@gmail.com`)

1. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (Dashboard → Settings → API → service_role).
2. Run:

```powershell
pnpm run admin:seed-user
```

Or apply migration `00021_seed_superadmin_varungoti.sql` after the user exists in Auth (`pnpm run supabase:db:push`).

## Sync env to Vercel from `.env.local`

```powershell
pnpm run vercel:sync-env        # neurospark-admin
pnpm run vercel:sync-env:app    # neurospark parent app
pnpm run vercel:deploy:admin    # redeploy after env change
```

## Deploy from CLI

```powershell
# Token in .env.local as VERCEL_TOKEN
node scripts/vercel-deploy.mjs        # both
node scripts/vercel-deploy.mjs app      # neurospark only
node scripts/vercel-deploy.mjs admin    # neurospark-admin only
```

Or manually:

```powershell
$tok = (Get-Content .env.local | Where-Object { $_ -match '^VERCEL_TOKEN=' }) -replace '^VERCEL_TOKEN=',''
pnpm dlx vercel@latest link --yes --token=$tok --scope=varubs-projects --project=neurospark
pnpm dlx vercel@latest deploy --prod --yes --token=$tok --scope=varubs-projects
```

Admin (from `admin/`):

```powershell
pnpm dlx vercel@latest link --yes --token=$tok --scope=varubs-projects --project=neurospark-admin
pnpm dlx vercel@latest deploy --prod --yes --token=$tok --scope=varubs-projects
```

## Rename an old project

If you previously deployed as project slug `admin`, either:

1. **Vercel dashboard** → Project `admin` → Settings → General → rename to **NeuroSpark Admin** and change slug to `neurospark-admin` if the UI allows, or  
2. Create `neurospark-admin` with the script above and delete the old `admin` project after cutover.

## Monorepo note

Root `vercel.json` intentionally deploys **only** the Vite parent app. Do not add `experimentalServices` unless you run Vercel’s multi-service preview; it previously inferred the wrong project name from the folder path `Kids Brain improvement app`.

# NuroSpark / NuroSocial OS — Supabase Edge Hosting Package

This package converts the NuroSpark Growth CRM + NuroSocial OS backend into a Supabase-ready structure.

## What this deploys

- Supabase Postgres schema
- Edge Function `portal` — lightweight hosted HTML portal
- Edge Function `crm` — leads, posts, tasks, payments API
- Edge Function `social-os` — providers, accounts, post scheduling API
- Edge Function `social-publish-worker` — scheduled publishing worker scaffold
- Edge Function `ai-growth` — content/AI brief scaffold
- Edge Function `razorpay-webhook` — payment webhook scaffold
- Smoke tests and GitHub Actions workflow

## Important reality check

Supabase Edge Functions are excellent for APIs and small HTML responses. They are not ideal for hosting a large React/Vite PWA as your only frontend. Best production setup:

- Host frontend on Vercel / Netlify / Cloudflare Pages
- Host backend APIs on Supabase Edge Functions
- Store CRM data in Supabase Postgres
- Store images/videos in Supabase Storage or Cloudflare R2

This package includes a simple `portal` Edge Function so you can open a live URL quickly.

## Deploy step-by-step

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="YOUR_ANON_OR_PUBLISHABLE_KEY"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
supabase secrets set CRON_SECRET="CHANGE_ME_32_CHARS"
supabase secrets set TOKEN_ENCRYPTION_KEY="CHANGE_ME_32_CHARS"
supabase secrets set PUBLIC_APP_URL="https://YOUR_PROJECT_REF.supabase.co/functions/v1/portal"
supabase functions deploy
```

Open:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/portal
```

## Smoke test

```bash
bash scripts/smoke-test.sh https://YOUR_PROJECT_REF.supabase.co YOUR_ANON_KEY
```

PowerShell:

```powershell
./scripts/smoke-test.ps1 -BaseUrl "https://YOUR_PROJECT_REF.supabase.co" -AnonKey "YOUR_ANON_KEY"
```

## Worker schedule

Supabase Edge Functions do not run continuously like a Node worker. Trigger `social-publish-worker` every 1–5 minutes using Supabase cron/scheduled functions, GitHub Actions cron, cron-job.org, Railway cron, or Cloudflare Workers Cron.

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/social-publish-worker" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

## Safety

- Do not store OAuth tokens in localStorage.
- Do not paste social passwords anywhere.
- Use OAuth only.
- Use official APIs only.
- Start with manual approval/simulation mode.
- Avoid scraping groups, auto-DMs, and spam.

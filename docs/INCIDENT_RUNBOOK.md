# Incident runbook (lightweight)

## Severity

- **P1:** Payments broken, auth down, data loss risk, app crash loop for most users.
- **P2:** Single feature broken (e.g. AI Counselor), elevated errors in Sentry.
- **P3:** Copy bug, non-blocking UI glitch.

## First response

1. **Identify scope:** web only, Android, iOS, or backend (Supabase / Edge Functions).
2. **Check Sentry** (if configured): spike in errors, release version, affected screens.
3. **Rollback:** revert last deploy or ship previous store build if P1.

## Key owners (fill in your team)

| Area | Owner | Notes |
|------|-------|--------|
| Supabase project | _name / email_ | Dashboard access, billing |
| Razorpay | _name / email_ | Live keys, webhooks, disputes |
| Domain / DNS | _name / email_ | |
| Sentry | _name / email_ | DSN, alerts |
| Play Console | _name / email_ | |
| App Store Connect | _name / email_ | |

## Common mitigations

- **Stop payments without app update (web):** set `VITE_FEATURE_FLAGS=payments_remote_kill` and redeploy the static bundle. Native apps already built still need a config endpoint or a new release for the same effect unless they load the web shell from your server.
- **Leak of anon key:** rotate in Supabase; update all hosting envs; anon key is public by design but abuse can spike — review RLS and rate limits on Edge Functions.
- **Leak of service role / Razorpay secret:** rotate immediately; audit access logs.

## After resolution

- Post short **incident note** (date, cause, fix, follow-up).
- Add a test or monitor if the gap was preventable.

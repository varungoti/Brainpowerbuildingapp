# Client error monitoring (optional Sentry)

## Behavior

- **`src/utils/monitoring.ts`** calls `Sentry.init` only when:
  - **`import.meta.env.PROD`** is true (production build), and  
  - **`VITE_SENTRY_DSN`** is a non-empty string.
- **Development** (`pnpm run dev`) does **not** send events (no DSN init in dev).
- **Session Replay is not enabled** — avoids capturing household screens or child-adjacent UI by default.
- **`sendDefaultPii: false`** — do not turn on PII without counsel review.

## What gets reported

- **`ErrorBoundary`** (`src/app/components/ErrorBoundary.tsx`) sends **`captureException`** with a truncated React **`componentStack`** (debugging aid, not user content).
- Unhandled errors may also be picked up by Sentry’s default browser integrations when the SDK is initialized.

## Configuration

Set in `.env` for **production builds** (see `.env.example`):

```bash
VITE_SENTRY_DSN=https://...@....ingest.sentry.io/...
VITE_APP_ENV=production   # or staging
```

## Operational notes

- Use a **separate Sentry project** (or environment filter) for staging vs production.
- If you later enable **Session Replay** or **tracing**, update **`docs/COPPA_GDPR_CHECKLIST.md`** and scrubbing rules — replays are high-risk for family apps.
- Do **not** call `Sentry.setUser` with parent email, child names, or Supabase UIDs unless privacy policy and retention are aligned.

---

*Master plan: C.1 Error monitoring.*

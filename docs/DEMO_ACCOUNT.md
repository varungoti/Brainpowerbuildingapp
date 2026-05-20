# Demo parent account & Fireworks AI (coach content)

Use this for **internal QA**, emulator dogfood, and stakeholder demos — not for production users.

## 1. Create the Supabase user (once per project)

1. Add **`SUPABASE_SERVICE_ROLE_KEY`** to gitignored `.env.local`  
   (Dashboard → **Project Settings → API → service_role** — never expose in client builds).

2. Ensure **`SUPABASE_URL`** or **`VITE_SUPABASE_PROJECT_ID`** matches your web app (same as `.env.example`).

3. Run:

```bash
pnpm run demo:create-user
```

Defaults:

| Field | Default |
|-------|---------|
| Email | `demo.parent@neurospark.local` |
| Password | `NeuroSparkDemo2026!` |

Override:

```bash
DEMO_PARENT_EMAIL=you+demo@yourdomain.com DEMO_PARENT_PASSWORD='YourLongSecret!' pnpm run demo:create-user
```

If the user already exists, the script exits with a hint — reset the password in **Authentication → Users** if needed.

** smoother QA:** In Supabase → **Authentication → Providers → Email**, disable **Confirm email** for staging projects so login works immediately.

## 2. Optional: one-tap demo login on internal APK / staging builds only

Add to `.env.local` **only for builds you control** (never Google Play production):

```bash
VITE_SHOW_DEMO_LOGIN=true
VITE_DEMO_LOGIN_EMAIL=demo.parent@neurospark.local
VITE_DEMO_LOGIN_PASSWORD=NeuroSparkDemo2026!
```

Rebuild: `pnpm run build:mobile` then install the APK.

**Security:** These values are embedded in the JS bundle. Anyone who extracts the APK can read them. Treat them like **shared staging passwords**.

## 3. Fireworks API → parent-facing AI content

Parent coaching (brain-profile coach, activity coaching JSON, counselor voice turns, printable guides) is implemented on the **Supabase Edge Function** in `supabase/functions/server/`.  
The LLM router prefers **Fireworks** when configured:

| Edge secret | Purpose |
|-------------|---------|
| `FIREWORKS_API_KEY` | Primary LLM + optional image workflows (`fw_…`) |
| `FIREWORKS_BUDGET_MODEL` | Optional override (default `accounts/fireworks/models/gpt-oss-20b`) |
| `FIREWORKS_QUALITY_MODEL` | Optional override for structured coach JSON (default `accounts/fireworks/models/gpt-oss-120b`) |
| `AI_FIREWORKS_PAUSED` | Set `true` to force fallback (OpenAI or deterministic templates) |

See **`docs/SETUP_CREDENTIALS.md`** § Edge secrets for the full table and **`supabase/functions/server/ai_provider.ts`** for routing.

After setting secrets, redeploy the Edge Function. In the app, coach calls hit:

`POST …/functions/v1/make-server-76b0ba9a/coach`  
with `Authorization: Bearer <anon key>` (already wired in `src/lib/coach/coachEngine.ts`).

## 4. Dogfood checklist after login

1. Complete onboarding (child profile).
2. **Home** → **Today** → generate pack → open **activity** → **Coaching** tab (local templates + optional Edge activity-coaching).
3. **Brain** → open **Coach** panel — requires AI consent for the child; responses use Fireworks when the Edge secret is set.
4. **AI Help** — counselor (network required).

Document findings under `dogfood-output/report.md`.

# Supabase Auth (optional)

When `VITE_SUPABASE_PROJECT_ID` and `VITE_SUPABASE_ANON_KEY` are set:

1. **Auth screen** uses `signUp` / `signInWithPassword` instead of the mock timer.
2. **Session** is stored under the key `neurospark_sb_auth` (separate from `neurospark_v2` app data).
3. **Session sync:** `auth.onAuthStateChange` keeps the app aligned with Supabase — initial session, sign-in, user metadata updates, and **remote sign-out** (e.g. other tab or revoked refresh token). Mock accounts (no `supabaseUid` on `user`) are **not** cleared by Supabase sign-out events.
4. **Token refresh:** handled by the JS client (`autoRefreshToken: true`). When the tab becomes visible again, the app calls `getSession()` to nudge recovery after sleep/backgrounding.
5. **Sign out** **awaits** `supabase.auth.signOut()` before clearing local app state (same fields as before: children, logs, KYC, outcomes — credits and materials inventory stay unless you change that product rule).

**Dashboard checklist**

- Authentication → Providers → **Email** enabled.  
- For dev: consider disabling “Confirm email” so signup logs in immediately.  
- Add your site URL to **Redirect URLs** if you use email confirmation.

**Not implemented yet:** syncing `children`, `activityLogs`, or `outcomeChecklists` to Postgres — see `supabase/migrations/00001_app_future_sync.sql` and **`docs/SUPABASE_SCHEMA_PLAN.md`** for the draft plan.

**Edge function:** After pulling changes, **redeploy** the `make-server` / AI counselor function so **`ai_literacy`** demo responses and the updated system prompt are live (demo mode when `OPENAI_API_KEY` is unset).

**Supabase CLI:** The app does not depend on the npm `supabase` package (its Windows bin often breaks `pnpm install`). To run the CLI locally, use the [official install](https://supabase.com/docs/guides/cli) (e.g. `npx supabase`, Scoop, or global binary) — not `pnpm add supabase` in this repo unless you accept bin warnings.

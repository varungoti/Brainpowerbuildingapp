# NDEQ Experiment Log

**Purpose:** Record small-burst experiments, scores, and **Adopt / Extend / Revert** decisions.  
**How to use:** Append a new block per experiment. Keep a **running summary** of domain scores (D1–D8) in the table below.

---

## Running domain scores (maintained by lead — adjust after each adopted experiment)

| Domain | Score (0–5) | Last updated | Notes |
|--------|-------------|--------------|-------|
| D1 Evidence | 4.0 | 2026-03-21 | Activity copy unchanged; claims still hedged in tips |
| D2 Pedagogy | **4.0** | 2026-03-21 | +24h rule + 3–7d spacing in `runAGE` |
| D3 Parent UX | **4.3** | 2026-03-21 | + “Why we picked this” on activity cards |
| D4 Safety | 4.5 | 2026-03-21 | Auth copy distinguishes local vs Supabase |
| D5 Code | **4.35** | 2026-03-19 | + Vitest for AGE helpers + `pnpm run verify`; no UI/routing changes |
| D6 Personalization | 4.0 | 2026-03-21 | KYC weights + history-based spacing |
| D7 Diversity | 4.0 | 2026-03-21 | Pack rules unchanged; spot-check: ≥4 intels for tier 3–5 |
| D8 Outcome proxy | **4.2** | 2026-03-21 | Monthly parent check-in + trend bars on Stats |

**Weighted composite (D1,D4,D8 ×1.5):** ≈ **4.16** — *update after each adopted experiment*

---

## Template — copy below this line for each experiment

### EXP-YYYYMMDD-001 — [short title]

- **Hypothesis:**  
- **Scope:** (files / features)  
- **Duration:** (e.g. 2 days)  
- **Owner:**  

**Pre scores** (rubric on target artifact):  
D1 __ D2 __ D3 __ D4 __ D5 __ D6 __ D7 __ D8 __ → Composite __

**Changes made:**  
- 

**Post scores:**  
D1 __ D2 __ D3 __ D4 __ D5 __ D6 __ D7 __ D8 __ → Composite __

**Quant checks** (if any): e.g. simulated packs avg intelligences: __

**Decision:** ☐ Adopt ☐ Extend ☐ Revert  

**Lessons:**  

---

## Logged experiments

### EXP-20260319-001 — KYC-driven AGE personalization (v1)

- **Hypothesis:** Incorporating Know-Your-Child signals into `runAGE` scoring improves D6 and D8 without reducing intelligence diversity below blueprint intent.  
- **Scope:** `activities.ts` (`runAGE`, `personalizationScoreBonus`), `GeneratorScreen` (pass KYC), AGE trace UI line.  
- **Duration:** 1 day  
- **Owner:** Engineering  

**Pre scores:** (baseline generator without KYC in scoring) — D6 ≈ 2, D8 ≈ 3 (documented in MASTER plan).  

**Changes made:**  
- Optional `personalization` parameter; bonus from learning style + traits + patience/sensitivity.  

**Post scores:** D1 4.0 · D2 3.5 · D3 4.0 · D4 4.5 · D5 4.0 · D6 **4.0** (↑) · D7 4.0 · D8 **3.5** (↑) → **Weighted composite ~3.9** (prior est. ~3.5)  

**Quant checks:** Pack assembly rules unchanged; KYC bonus capped at 28 so diversity constraints still bind.  

**Decision:** ☑ **Adopt** — D6/D8 up; D1/D4 non-regression; gates satisfied per NDEQ §5.  

**Lessons:** Keep caps on profile bonus so mood/materials/tier stay primary; revisit weights after parent checklist ships.  

---

### EXP-20260321-002 — Spaced repetition & 24h exclusion (AGE v2)

- **Hypothesis:** Using **last completion time** per activity improves D2/D8 (spacing effect) without breaking small-catalog packs.  
- **Scope:** `activities.ts` (`buildLastCompletionMap`, `spacedRepetitionScoreBonus`, `runAGE`); `GeneratorScreen` passes map; AGE trace line.  
- **Duration:** 1 day  
- **Owner:** Lead (AI-assisted)  

**Pre scores:** Composite ~3.9 (table above pre-tweak).  

**Post scores:** D1 4.0 · D2 **4.0** (↑) · D3 4.0 · D4 4.5 · D5 4.0 · D6 4.0 · D7 4.0 · D8 **3.8** (↑) → **Weighted composite ~4.05**  

**Quant checks:** `recentActivityIds` weight reduced 10→6 to avoid double-counting with calendar spacing.  

**Decision:** ☑ **Adopt**  

**Lessons:** Only enable spacing once ≥1 completed log exists so cold-start packs stay unbiased.  

---

### EXP-20260321-003 — Monthly parent outcome checklist (D8)

- **Hypothesis:** A **short, repeatable parent-rated checklist** improves measurable outcome proxy (D8) without clinical claims.  
- **Scope:** `outcomeChecklist.ts`, `AppContext` persistence `outcomeChecklists`, `OutcomeChecklistCard.tsx`, `StatsScreen`.  
- **Duration:** 1 day  
- **Owner:** Lead (AI-assisted)  

**Pre scores:** D8 3.8; composite ~4.05.  

**Post scores:** D1 4.0 · D2 4.0 · D3 **4.2** (↑) · D4 **4.5** · D5 4.0 · D6 4.0 · D7 4.0 · D8 **4.2** (↑) → **Weighted composite ~4.15**  

**Quant checks:** 8 items × 1–5; one row per child per `YYYY-MM`; sparkline uses last 6 months.  

**Decision:** ☑ **Adopt**  

**Lessons:** Logout clears `outcomeChecklists` with other local data; sync to cloud remains future work.  

---

### EXP-20260321-004 — “Why we picked this” + optional Supabase Auth

- **Hypothesis:** Parent-facing **selection rationale** (D3/D8) and **optional Supabase Auth** (D5) improve trust without forcing cloud child data.  
- **Scope:** `activityWhy.ts`, `GeneratorScreen` card block; `utils/supabase/client.ts`; `AuthScreen`; `AppContext` session restore + `loginUser` options + `signOut`; `User.supabaseUid`; migration sketch SQL.  
- **Duration:** 1 day  
- **Owner:** Lead (AI-assisted)  

**Pre scores:** Composite ~4.15.  

**Post scores:** D1 4.0 · D2 4.0 · D3 **4.3** (↑) · D4 4.5 · D5 **4.2** (↑) · D6 4.0 · D7 4.0 · D8 **4.25** (↑) → **Weighted ~4.2**  

**Decision:** ☑ **Adopt**  

**Lessons:** Child/activity data remains in `neurospark_v2` until a sync feature ships; document email confirmation dev trap.  

---

### EXP-20260319-005 — Vitest + verify script + regression guardrails (no UI loss)

- **Hypothesis:** **Automated tests** for `runAGE` helpers and a single **`verify`** command reduce regressions (D5) without touching screens or navigation.  
- **Scope:** `src/app/data/*.test.ts`, `vite.config.ts` (Vitest), `package.json` scripts, `.cursorrules` regression rules, `MASTER_DEVELOPMENT_PLAN.md` checklist sync (“Why we picked”), root `README.md`.  
- **Duration:** 1 day  
- **Owner:** Engineering (AI-assisted)  

**Pre scores:** D5 4.2; composite ~4.2.  

**Changes made:**  
- 10 unit tests (`buildLastCompletionMap`, `spacedRepetitionScoreBonus`, `personalizationScoreBonus`, `runAGE` tier + 24h rule, `buildWhyPickedLines`).  
- `pnpm run verify` = typecheck + test + build.  

**Post scores:** D1 4.0 · D2 4.0 · D3 4.3 · D4 4.5 · D5 **4.35** (↑) · D6 4.0 · D7 4.0 · D8 4.25 → **Weighted ~4.16**  

**Quant checks:** All `AppView` routes unchanged; bottom nav unchanged.  

**Decision:** ☑ **Adopt**  

**Lessons:** Document “do not remove routes” in `.cursorrules`; keep tests pure (node env) to avoid pulling React into Vitest until needed.  

---

### EXP-20260319-006 — AI literacy track + legal screen + AGE options

- **Hypothesis:** Shipping **tagged AI-literacy activities**, **generator toggles**, **AGE options + swap-in**, **Legal & Trust screen**, and **counselor category alignment** advances master-plan C.2/C.4 without removing navigation.  
- **Scope:** `activities.ts` (a26–a29, skillTags, `runAGE` options), `GeneratorScreen`, `activityWhy.ts`, `AICounselorScreen`, `LegalInfoScreen`, `AppContext`/`App.tsx`, `ProfileScreen`, tests, `MASTER_DEVELOPMENT_PLAN.md`.  
- **Duration:** 1 day  
- **Owner:** Engineering (AI-assisted)  

**Decision:** ☑ **Adopt** — `pnpm run verify` green; new `legal_info` route + Profile link; all prior screens preserved.  

**Lessons:** Diversify **regions** on new tagged activities so region-capped packs can still swap in an AI-literacy item.  

---

### EXP-20260319-008 — ESLint cleanup + accessibility baseline

- **Scope:** Removed unused imports/dead code across screens; `StatChip` uses `color` for top border; `App.tsx` skip link, `main` landmark, nav/back ARIA; `docs/ACCESSIBILITY.md`.  
- **Decision:** ☑ **Adopt** — `pnpm run lint` reports **0 errors, 0 warnings**; verify green.  

---

### EXP-20260319-009 — Privacy-light product analytics

- **Scope:** `src/utils/productAnalytics.ts`, Paywall + Generator hooks, `activity_complete` in `logActivity`, `VITE_ANALYTICS_ENDPOINT`, `docs/PRODUCT_ANALYTICS.md`, Legal privacy copy, tests.  
- **Decision:** ☑ **Adopt** — funnel events without PII; dev `console.debug`; optional HTTP sink.  

---

### EXP-20260319-010 — E2E smoke, Edge analytics rollup, COPPA checklist

- **Scope:** Playwright (`playwright.config.ts`, `tests/e2e/smoke.spec.ts`), CI `E2E_SKIP_BUILD` + Chromium install; Supabase `POST .../analytics/event` + daily `kv` counts; `productAnalytics` sends `Authorization` when anon key set; `docs/COPPA_GDPR_CHECKLIST.md`, `PRODUCT_ANALYTICS` + `MASTER` ticks.  
- **Decision:** ☑ **Adopt** — smoke loads `#root` + NeuroSpark; counsel review still required for real compliance.  

---

### EXP-20260319-011 — Env/staging doc + optional Sentry

- **Scope:** `docs/ENVIRONMENT_AND_STAGING.md`, `docs/ERROR_MONITORING.md`, `src/utils/monitoring.ts`, `main.tsx` init, `ErrorBoundary` → `reportClientError`, `VITE_SENTRY_DSN` / `VITE_APP_ENV` in `vite-env.d.ts` + `.env.example`, `@sentry/react`, `MASTER` C.1 ticks, `COPPA` checklist Sentry line.  
- **Decision:** ☑ **Adopt** — prod-only, no replay; staging/prod separation documented as deploy concern.  

---

### EXP-20260319-012 — Local backup wizard + RLS sketch + content workflow doc

- **Scope:** `neurosparkBackup.ts` + tests, `AppContext` `exportLocalDataBackup` / `importLocalDataBackup`, Profile **Backup & new device** UI, `docs/DATA_SYNC_AND_BACKUP.md`, `00002_rls_sketch_profiles_children.sql`, `CONTENT_EDITORIAL_WORKFLOW.md`, `MASTER` / `docs/README` / `SUPABASE_SCHEMA_PLAN` updates.  
- **Decision:** ☑ **Adopt** — replace-only restore; validates payload; active child id normalized.  

---

### EXP-20260319-013 — Supabase auth lifecycle + legal refunds tab + publishing checklist

- **Scope:** `AppContext` `onAuthStateChange` (SIGNED_OUT clears Supabase-linked local session), visibility `getSession`, awaited `signOut` + clear pack/activity views; `LegalInfoScreen` Refunds tab; `LEGAL_PUBLISHING_CHECKLIST.md`; `SUPABASE_AUTH.md`; `MASTER` C.1/C.4 ticks.  
- **Decision:** ☑ **Adopt** — mock-only accounts unaffected by remote Supabase sign-out.  

---

### EXP-20260319-007 — CI, ESLint, PWA manifest, schema plan, `ai_literacy` demo API

- **Scope:** `.github/workflows/ci.yml`, `eslint.config.mjs` + `pnpm run lint` in `verify`, `public/manifest.webmanifest`, `index.html` meta/manifest, `docs/SUPABASE_SCHEMA_PLAN.md`, `DEMO_RESPONSES.ai_literacy` + system prompt line in `supabase/functions/server/index.tsx`.  
- **Decision:** ☑ **Adopt** — `pnpm run verify` green; edge demo path supports **AI & tools at home** category when `OPENAI_API_KEY` unset.  

---

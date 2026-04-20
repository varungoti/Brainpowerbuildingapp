# Progress

## FUTURE_ROADMAP §1.2.I — Auth + onboarding + first-activity loop covered by Playwright E2E (April 2026, night +3, +follow-up #5)
Closes the **last open §1.2.I "Cross-cutting hardening" bullet** — every item under that section is now ✅ shipped.

### What shipped
- **`captureProductEvent` now also dispatches a `neurospark:product_event` `CustomEvent`** carrying the same `ProductEventPayload`. One allocation per event, zero-listener cost in production. The dispatch sits inside the `productAnalytics.ts` capture path so unit tests, future browser-extension integrations, and the new E2E spec can subscribe to the funnel without spinning up an HTTP sink.
- **New spec `tests/e2e/auth-onboarding-first-activity.spec.ts`** drives a real production build through the entire funnel:
  1. Cold landing → "Get Started Free" → AuthScreen
  2. Signup form (`Priya` / `priya@example.com` / `secret1`) → "Create Account & Start"
  3. Onboarding: welcome → "Set Up My Child" → child name → "Next: Materials" → "Select All" → "Next: All Ready" → "Generate First Activities"
  4. Home → "Today" → "Generate My Pack"
  5. Expand first card → "Open full detail" (fires `activity_open` + `first_activity_open`)
  6. "Back to activities" → re-expand → "Mark as Complete" → "Done! +XX BP" (fires `activity_complete` + `first_activity_complete`)

### Asserted invariants
- **Presence**: every event in the funnel fires (`auth_view`, `auth_submit_attempt`, `auth_submit_success`, `onboard_step_view × 4`, `onboard_complete`, `activity_open`, `first_activity_open`, `activity_complete`, `first_activity_complete`).
- **Key props**: `auth_view.{screen, auth_mode}`, `auth_submit_attempt.dwell_ms` (number), `onboard_step_view.step` covers all four `welcome|child|materials|ready`, `onboard_complete.screen === "onboard_ready"`, `activity_open.is_first_activity === true`, `activity_complete.is_first_activity === true`.
- **Order**: `auth_view → auth_submit_success → onboard_complete → first_activity_open → first_activity_complete`.
- **Uniqueness**: `first_activity_open` and `first_activity_complete` each fire exactly once per signup (the `firedForActivityIdRef` in `ActivityDetailScreen` and the `wasFirstActivityForChild` derivation in `AppContext.logActivity` are the two places that could regress).

### How the spec stays deterministic on developer machines
- The build is run with `VITE_E2E_SUPPRESS_SB_CLIENT=true` (existing escape hatch in `src/utils/supabase/client.ts`) so AuthScreen takes the **local fallback path** instead of hitting the user's real Supabase project — otherwise the email-confirmation branch would block the funnel.
- The spec pre-seeds `credits: 3` (only that field) into `neurospark_v2` via `addInitScript` so the brand-new account isn't sent straight to the paywall when generating its first pack. `user` / `children` are deliberately left null so the auth + onboarding funnel still runs naturally.
- Event capture wires `page.exposeFunction("__nsCaptureEventForTest", ...)` BEFORE the listener registration in `addInitScript`, so the binding exists by the time the page loads.

### Files
- Added: `tests/e2e/auth-onboarding-first-activity.spec.ts` (~210 lines).
- Modified: `src/utils/productAnalytics.ts` (+10 lines for the CustomEvent dispatch).
- Modified: `docs/FUTURE_ROADMAP.md` (Cross-cutting bullet struck, gap-fix table extended).
- Modified: `memory-bank/activeContext.md`, `memory-bank/progress.md`.

### Verification
- `pnpm tsc --noEmit` clean.
- `pnpm exec vitest run src/utils/productAnalytics.test.ts src/utils/posthogForwarder.test.ts src/utils/monitoring.test.ts` → 19/19 green (CustomEvent dispatch is non-breaking — existing assertions still hold).
- `pnpm exec playwright test tests/e2e/auth-onboarding-first-activity.spec.ts` → **1/1 passed**.

### Closes
- §1.2.I Cross-cutting bullet "E2E coverage for the auth + onboarding + first-activity loop with Playwright running in CI" → struck through; this was the last open item in that section.

---

## FUTURE_ROADMAP §1.2.I — Auth/onboarding/first-activity telemetry + Sentry/PostHog remote flag (April 2026, night +3, +follow-up #4)
Closes two more §1.2.I cross-cutting bullets in one production-ready pass — funnel telemetry + a remote-controllable monitoring backend.

### Pass 1 — Funnel telemetry
Before this pass we had `pack_generate` and `activity_complete` but no visibility into where new accounts dropped off in the auth/onboarding flow. New events added to the `ProductEventName` taxonomy:

- `auth_view` — fires on AuthScreen mount AND when the user toggles signup ↔ login. Carries `screen: "auth"`, `auth_mode`.
- `auth_submit_attempt` — fires on submit click before the network call. Carries `auth_mode`, `dwell_ms` (ms between mount and submit).
- `auth_submit_success` — fires on both signup-with-session and login success.
- `auth_submit_fail` — fires on Supabase error, with `fail_reason` bucketed via a new `classifySupabaseAuthError(msg)` helper into stable tokens (`invalid_credentials`, `weak_password`, `rate_limited`, `network_error`, `email_not_confirmed`, `user_exists`, `auth_error`, `email_confirmation_pending`). Critically: we never forward the raw error string, which can include emails / IP addresses / Supabase trace ids.
- `onboard_step_view` — fires once per mount of each Step component via a new `useOnboardStepView(step)` hook in `OnboardingScreen.tsx`. Steps: `welcome`, `child`, `materials`, `ready`.
- `onboard_complete` — fires on the StepReady "Generate First Activities" CTA, with `age_tier` for cohort analysis.
- `activity_open` — fires once per distinct `viewingActivity.id` from `ActivityDetailScreen` via a `firedForActivityIdRef` so tab switches and `activityLogs` updates don't re-fire.
- `first_activity_open` — fires alongside `activity_open` IFF the active child has zero completed activities.
- `first_activity_complete` — fires from `AppContext.logActivity` when `wasFirstActivityForChild` is true (computed from `pRef.current.activityLogs` BEFORE the new entry is pushed).
- `is_first_activity` boolean is also attached to the existing `activity_complete` event so funnel queries can pivot without joining.
- New `ProductEventProps` fields: `screen`, `step`, `auth_mode`, `is_first_activity`, `dwell_ms`.

Wired into:

- `AuthScreen.tsx` — `auth_view` on mode toggle, `auth_submit_attempt` with dwell, `auth_submit_success`/`auth_submit_fail` on each branch including the email-confirmation-pending path (logged as a fail with `fail_reason: "email_confirmation_pending"` so funnel reports can distinguish "we sent you an email" from a real failure).
- `OnboardingScreen.tsx` — `useOnboardStepView` hook in each Step component, `onboard_complete` on the final CTA.
- `ActivityDetailScreen.tsx` — fire-once-per-id ref pattern so we don't double-count tab switches.
- `AppContext.tsx` — `wasFirstActivityForChild` is computed from `pRef.current.activityLogs.filter(l => l.childId === log.childId && l.completed).length === 0` BEFORE the functional setP updater runs, so it can never observe its own write.

### Pass 2 — Sentry/PostHog wiring behind a remote-config flag
Sentry was already initialised in `monitoring.ts` but with no kill switch. Pass 2:

- **`monitoring_kill` flag in `featureFlags`** — set `VITE_FEATURE_FLAGS=monitoring_kill` to disable Sentry init without redeploying app code. New `isClientMonitoringActive()` getter for tests.
- **New `src/utils/posthogForwarder.ts`** — zero-dependency PostHog HTTP forwarder that piggybacks on the existing batched `flushBatch()` in `productAnalytics.ts`. Posts to `{host}/i/v0/e/` (default host `https://us.i.posthog.com`, override via `VITE_POSTHOG_HOST`). Activation requires all three: `import.meta.env.PROD === true`, `VITE_POSTHOG_KEY` set, AND `posthog` listed in `VITE_FEATURE_FLAGS`. Anonymous `distinct_id` is generated via `crypto.randomUUID()` (with a Math.random fallback for ancient browsers) and persisted to `localStorage` under `neurospark.posthog.distinct_id` so it survives reloads. Privacy-light: copies the same NeuroSpark `ProductEventPayload` shape into PostHog's `properties` field (no autocapture, no replay, no user identification). Adds `$lib: "neurospark-web"` and `$lib_version` from `VITE_APP_VERSION`.
- **`forwardEventsToPostHog(batch)` in `flushBatch`** — the same batch is fanned out to PostHog AND the existing `VITE_ANALYTICS_ENDPOINT` sink. Either can be configured independently.
- **`vite-env.d.ts`** — declared `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST`.

### Verification
- `pnpm tsc --noEmit` clean.
- `pnpm test --run` = **279/279 vitest passing across 41 files** (was 263 → +16 from this pass: 8 in `posthogForwarder.test.ts`, 4 new in `monitoring.test.ts`, 1 new in `productAnalytics.test.ts` covering all 9 new event names + `is_first_activity`).
- `pnpm lint` clean.

### Vitest 4 trap fixed in passing
While writing tests, discovered that `vi.stubEnv("PROD", anyValue)` always coerces `import.meta.env.PROD` to boolean `true` — even when the value passed in is the string `"false"`. Documented the canonical pattern in both `posthogForwarder.test.ts` and `monitoring.test.ts`: "PROD on" = `vi.stubEnv("PROD", true)`, "PROD off" = don't stub PROD at all. Both `posthogForwarder.ts` and `monitoring.ts` also gained an `isProductionBuild()` helper that handles both real-build (`PROD: true` boolean) and stubbed-test (`PROD: "true"` string) shapes defensively.

### Roadmap
- §1.2.I list now strikes BOTH the per-screen telemetry and the Sentry/PostHog remote-flag bullets, leaving only the Playwright E2E item open.
- Gap-fix table in §1.0 extended with a row for this pass.

## FUTURE_ROADMAP §1.2.I — WCAG AA contrast audit on BrainCanvas surfaces (April 2026, night +3, +follow-up #3)
Continuation of the cross-cutting hardening sweep. The §1.2.I "WCAG audit pass on color contrast in BrainCanvas legend and tooltips" item had been sitting on the backlog forever; this pass closes it with a regression-tested contrast library.

- **Audit findings (real failures):**
  - `BrainTooltip` percent pill renders slate-900 (`#0F172A`) on `region.color`. On the bodily region's `#7A69E8` indigo this gives only 3.7:1 — fails WCAG AA (4.5:1) for normal text. White also fails (4.26:1). Neither plain text choice works.
  - `BrainLegend` percent pill renders `region.color` text on `region.color + "22"` (13% alpha tint of itself over white). Foreground and background share the same hue → contrast collapses for every light pastel (`#D9DD67`, `#94E55C`, `#BFEFF2`, `#AEEED4`, etc.).
- **New `src/lib/brain/contrast.ts`** — WCAG 2.1 primitives plus a pill-styling helper:
  - `relativeLuminance(hex)` — sRGB linearisation per WCAG 2.1.
  - `getContrastRatio(a, b)` — returns the standard 1–21 ratio.
  - `getReadableTextOn(bg)` — returns whichever of slate-900 / white has the higher ratio against `bg`.
  - `compositeOver(fgWithAlpha, opaqueBg)` — Porter-Duff "source over" so we can reason about alpha-tinted backgrounds correctly.
  - `getAccessiblePillStyle(bg, threshold = 4.5)` — the workhorse. Picks light or dark text based on `bg` luminance, then darkens (for light text) or lightens (for dark text) the background in 5% steps (capped at 60% mix) until the chosen text passes AA. Returns `{background, color}`.
- **Component edits:**
  - `BrainTooltip.tsx` — percent pill now uses `getAccessiblePillStyle(region.color)`. The `#7A69E8` indigo gets darkened just enough to clear AA with white text; every other region keeps its original swatch.
  - `BrainLegend.tsx` — percent pill background stays `region.color + "22"` (visual identity preserved), but the text is now fixed slate-700 (`#334155`). Verified via the contrast suite that this passes AA against the 13%-tint over white for all 15 region colors.
- **`src/lib/brain/contrast.test.ts` (NEW, 52 tests)**
  - Primitives: black/white sanity (21:1, 1:1), pure-channel luminance bounds, `compositeOver` mixes correctly.
  - `getReadableTextOn` returns the higher-contrast of slate-900/white for every BrainRegion (parametric × 15).
  - `getAccessiblePillStyle` guarantees AA for every BrainRegion (parametric × 15) — this is the regression net for new region colors.
  - "Slate-700 on 13% tint over white" passes AA for every BrainRegion (parametric × 15) — the regression net for the legend pill.
  - Regression check: hard-coded slate-900 on `#7A69E8` is below AA (catches anyone re-introducing the old hard-code).
- **Verification:** `pnpm tsc --noEmit` clean; `pnpm test --run` = **263/263 vitest passing across 40 files** (+52 from this pass); `pnpm lint` clean.
- **Roadmap edit:** §1.2.I list now strikes the WCAG audit item with a green check; gap-fix table extended with the contrast-audit row.

## FUTURE_ROADMAP §1.0 follow-up — voice adapter / community plugins (April 2026, night +3, +follow-up #2)
Continuation of the §1.0 follow-ups closure. The previous pass struck the sync-state KV → Postgres item; this pass strikes the next one — wiring the §2.4 community Capacitor plugins so a dev can ship native TTS + STT today without waiting for the in-house `NeuroSparkVoice` plugin.

- **`src/lib/voice/nativeVoiceAdapter.ts` extended**
  - New `CommunityTTS` and `CommunitySTT` interfaces capture only the bits we actually call from `@capacitor-community/text-to-speech` (v4.x) and `@capacitor-community/speech-recognition` (v6.x). Zero direct imports — discovery is via `window.Capacitor.Plugins.{TextToSpeech,SpeechRecognition}` which Capacitor self-registers at boot.
  - New `CommunityPluginAdapter` class implements the existing `VoiceAdapter` contract on top of either plugin:
    - **TTS**: `tts.speak({text, lang: locale, rate, pitch})` then fires `onEnd`. `cancelSpeech` calls `tts.stop()`.
    - **STT**: `stt.available()` gate → optional `checkPermissions/requestPermissions` flow → optional `addListener("partialResults", …)` for live partials → `stt.start({language, partialResults, popup: false})` returns the final transcript via `result.matches[0]`. Errors go through `opts.onError` with stable codes (`speech_recognition_unavailable`, `speech_recognition_permission_denied`).
    - Each missing primitive (no TTS plugin → web TTS; no STT plugin → web STT) silently delegates to a held `WebVoiceAdapter` so the composite is always whole.
  - `pickAdapter()` now picks in priority order: `NeuroSparkVoice` (full-stack) → `CommunityPluginAdapter` (partial) → `WebVoiceAdapter` (always). Community plugins are deliberately ignored on the web platform — Capacitor wouldn't load them there and `WebVoiceAdapter` is a more honest fit.
- **`src/lib/voice/nativeVoiceAdapter.test.ts` (NEW, 9 tests, jsdom)**
  - Covers: no Capacitor → web; Capacitor web platform → web; community plugins on web → ignored; NeuroSparkVoice on native wins outright; community-only on native → composite; TTS-only on native composes with web STT; `tts.speak` is called with the mapped option shape and fires `onEnd`; the per-call cache returns the same instance; `__resetVoiceAdapterForTests` clears the cache.
- **Verification:** `pnpm tsc --noEmit` clean; `pnpm test --run` = **211/211 vitest passing across 39 files** (+9 from this pass); `pnpm lint` clean.
- **Roadmap edit:** §1.0 open-follow-ups list now has this item under a green check, leaving only the in-house `NeuroSparkVoice` plugin (full-stack), Picovoice Porcupine, and IAP. Gap-fix table extended with the community-plugin row.

## FUTURE_ROADMAP §1.0 follow-up — sync state KV → Postgres (April 2026, night +3, +follow-up)
Single-purpose pass triggered by re-reading `docs/FUTURE_ROADMAP.md` §1.0 "Open follow-ups". The `user_sync_state` Postgres table from `00009_sync_state.sql` had been sitting unused — `/sync/state` was still KV-only.

- **Migration in `supabase/functions/server/index.tsx`**
  - New helpers `readSyncFromPostgres(userId)` and `writeSyncToPostgres(userId, version, state, deviceId)` use the service-role `createClient` pattern already used by `coach_memory`, `child_sleep_signal`, etc.
  - `postSyncState` resolves "previous version" from Postgres first, then KV (legacy). Computes `newVersion = prev + 1`, derives `conflict = clientVersion < prevVersion` exactly as before. Upserts into `user_sync_state` (`onConflict: "user_id"`). If Postgres is unreachable the handler falls back to a KV write so single-region failures don't break the client.
  - `getSyncState` reads Postgres first; on miss it consults KV; if KV has a non-zero version it kicks off a fire-and-forget Postgres backfill (`void writeSyncToPostgres(...)`) so the next pull is Postgres-only — true lazy migration without a script.
  - Wire contract unchanged: still `{version, conflict}` for writes, `{version, state}` for reads. The 8 `cloudSync.test.ts` tests therefore needed no changes.
- **Why this matters**
  - Postgres rows are queryable + RLS-protected, KV is opaque and region-pinned. Cross-device load now justifies the move (per the original §1.0 condition).
  - Lazy migration means zero downtime + zero ops scripts. Devices that last synced under KV-only still recover their state on next pull.
  - The dual-write availability fallback (Postgres unreachable → KV) keeps the system honest: clients never see a `500` because of a regional Postgres outage.
- **Verification:** `pnpm tsc --noEmit` clean; `pnpm test --run` = **202/202 vitest passing across 38 files**; no client-side changes needed.
- **Roadmap edit:** §1.0 open-follow-ups list now strikes this item; gap-fix table extended with the migration row.

## AI-Age Readiness v1 — §0.8 closure pass (April 2026, night +3)
Single-purpose pass triggered by re-reading `docs/FUTURE_ROADMAP.md`. The §0.8 "Definition of done" still showed Phase A–F unchecked despite all six having shipped, AND Phase C content was 1/5 of target on the most strategically important dimension.

- **`ai-literacy-cocreation (deep)` — 1 → 5 supervised co-creation projects**
  - Pre-existing: `a74` "Co-Write a Story with the AI Helper" (the only true co-creation project; a73/a75/a86 only touched the topic).
  - Authored 4 new end-to-end rituals in `src/app/data/activities.ts`:
    - `a91` "Co-Design a Birthday Card with the AI Helper" — recipient + feeling brief → AI image-prompt → child critique + re-prompt × 2 → hand-finished card.
    - `a92` "Build a Real Lego Model from an AI Plan" — 6-step AI plan → physical build → log every "AI miss" sticky note → optional re-prompt v2.
    - `a93` "Co-Compose a 30-Second Song with the AI Helper" — child writes line 1 → AI suggests 3 continuations → child picks/rewrites/rejects → child performs (AI never voices).
    - `a94` "Plan a Real Outing with an AI Travel Helper" — brief → 3 options + risks → child colour-rates → walk the plan → 1-sentence "the AI was right that ___ but didn't know that ___".
  - Each carries `competencyTags`, `whyAIAge`, evidence-cited `parentTip`, child-owned artefact, ageTiers, and an explicit "where did the AI miss what we meant?" debrief — these are rituals, not topic-touches.
  - Catalogue total: 70 legacy + 24 AI-age authored = **94 activities**, all under-served Phase C dimensions now ≥ §0.5 target.

- **`docs/FUTURE_ROADMAP.md` cleanup**
  - §0.8 Definition-of-done table updated: engine + Phase A/B/C/D/E/F all marked ✅ with itemised evidence (file paths + dimension counts), test pass count corrected to 202/202.
  - §1.0 implementation snapshot test count corrected from stale `145/145` to current `202/202`.
  - §1.0 gap-fix table extended with the a91–a94 row so the next reader can see exactly what closed the §0.5 Phase C gap and why a73/a75/a86 didn't already count.

- **Verification:** `pnpm tsc --noEmit` clean; `pnpm test --run` = **202/202 vitest passing across 38 files**. No regressions; the 4 new activities are auto-tagged through the existing `inferCompetencyTags` fallback for back-compat with consumers that read `Activity` without `competencyTags` set.

## 10-year survivor bets — fourth-pass (April 2026, night +2)
Two production-credibility moves on top of the third pass: a code-splitting pass that visibly speeds up first paint on parent mobile, and a follow-up `ce:brainstorm` artifact that picks the production runtime + model for Survivor 3.

- **Code-splitting pass — main bundle 232 KB → 164 KB gzip (-29 %)**
  - `src/app/App.tsx` now `React.lazy()`s 24 tail-traffic screens (`StatsScreen`, `YearPlanScreen`, `MilestonesScreen`, `LegalInfoScreen`, `BlueprintDocsScreen`, `FeedsScreen`, `ReportScreen`, `SiblingModeScreen`, `PortfolioScreen`, `SeasonalLibraryScreen`, `LanguageSettingsScreen`, `SensorySettingsScreen`, `BondingScreen`, `RoutineScreen`, `CaregiversScreen`, `QuestsScreen`, `NotificationSettingsScreen`, `AIPrivacyScreen`, `AudioModeScreen`, `CoachMemoryScreen`, `RuptureRepairScreen`, `SleepLogScreen`, `SnapshotScreen`, `SnapshotSharesScreen`).
  - Critical-path screens stay eager: `LandingScreen`, `AuthScreen`, `OnboardingScreen`, `HomeScreen`, `GeneratorScreen`, `HistoryScreen`, `ProfileScreen`, `AddChildScreen`, `PaywallScreen`, `BrainMapScreen`, `ActivityDetailScreen`, `AICounselorScreen`. Everything reachable in ≤2 taps from boot is in the main chunk.
  - Wrapped `<ScreenContent>` in a `<Suspense>` boundary backed by a `LazyScreenFallback` (a11y `role="status"` + `aria-live="polite"` + 3-line skeleton with `sr-only` "Loading screen…").
  - Build output: 24 separate chunks, all <25 KB gzip; main `index-vC80dAHh.js` = 164 KB gzip. Chunk-size warning suppressed naturally (no longer hit). Behaviour unchanged.
  - Verified: `pnpm tsc --noEmit` clean, `pnpm lint` clean, `pnpm test --run` = **202/202 passing** (no regressions), `pnpm build` clean.

- **Survivor 3 `ce:brainstorm` artifact — `docs/ideation/2026-04-18-survivor-3-on-device-brainstorm.md`**
  - Picks the production runtime: **WebLLM 0.2.x + Llama-3.2-1B-Instruct-q4f16_1-MLC** for web/PWA (~900 MB weights), **`@capacitor-community/llm` + Phi-3.5-mini-Q4** for Capacitor native (~1.8 GB IPA delta or lazy-fetched), Apple Foundation Model preferred where present (iOS 18.1+).
  - Numeric constraint matrix (≤180 KB gzip main, ≤900 MB first weights, ≤4 s cold first-token, ≥15 t/s steady, ≤0.5 % battery/turn, 0 KB delta when runtime absent) — Phase 0 already meets the bundle constraint via the third-pass dynamic-import skeleton.
  - Lazy-install + cache strategy: weights gated behind a single "Enable on-device AI" CTA in `AIPrivacyScreen`; `Cache Storage` keyed by model URL; resumable downloads; Wi-Fi precondition; battery + thermal refusal.
  - Public `/verifier` page on the marketing site: live `PerformanceObserver` of outbound requests filtered against a pre-declared host allowlist; turns "we say it's on-device" into "any pediatrician/regulator/competitor can prove it themselves".
  - 4-phase build roadmap (Phase 0 = third pass, already done; Phase 1 = web PWA happy path, 2 weeks; Phase 2 = Capacitor native + Apple Foundation Model, 4 weeks; Phase 3 = verifier + standard alignment, 6 weeks; Phase 4 = S1 long-memory variant on IndexedDB, 12 weeks).
  - Explicit kill criteria (cold first-token >6 s, fall-back rate >35 %, weights-purge rate >12 %/wk, Apple/Google ship competing kids' AI SDK by Q3 2026).
  - Unlock map showing why S3 is the prerequisite for S1 long-memory, S2 audio-only mode, S5 verified-on-device badge tier, and S6 pediatrician trust footer.

## 10-year survivor bets — third-pass deepening (April 2026, evening +1)
Building on the second-pass surfaces, this pass closes runtime + transparency + workspace gaps that were one stop short of "production-credible".

- **S3 third pass — real WebGPU/WebLLM probe + lazy engine**
  - `src/lib/localAi/index.ts` gets `hasWebGpu()` (sniffs `navigator.gpu`), `probeWebLlm()` (returns `{ available, reason: "no-webgpu" | "no-package" | "ok" }` so the privacy panel can explain *why* on-device is unavailable), and `getOrInitWebLlmEngine()` (single-flight, cached per session — first call pays the WebLLM warm-up; subsequent turns reuse the engine).
  - `getLocalRuntimeStatus()` now probes native `@capacitor-community/llm` first, then falls back to WebLLM, and reports the actual `modelName` (`phi-3.5-mini (native)` / `Llama-3.2-1B-Instruct (WebLLM)` / `cloud-fallback`) and `bundleSizeMb` so the privacy panel and AGE consumer can render honest numbers.
  - `routedChat()` now has three runtime paths in priority order: native plugin → WebLLM (web/PWA) → cloud-fallback (only when consent allows). Strict `on-device` mode still refuses cloud rather than secretly going to it.
  - New unit suite (`src/lib/localAi/localAi.test.ts`) covers WebGPU detection toggling, the no-webgpu / no-package branches, and runtime-status caching. Test-only `_resetRuntimeStatusForTests()` exported for the suite.

- **S1 third pass — coach memory transparency chip**
  - `src/components/coach/CoachPanel.tsx` now fetches `listCoachMemory(childId)` on open (when consent is on) and renders a violet `🧠 Remembering N observations about {name}` chip below the panel header. Auto-log path optimistically increments the count, so the chip updates without a re-fetch.
  - Survivor 1's long-memory injection used to be invisible to the parent — now it's first-class, which both builds trust and makes consent revocation feel meaningful.

- **Workspaces — studio + marketing-site green for the first time end-to-end**
  - `studio/` had no `node_modules` and no vitest config; both fixed. New `studio/vitest.config.ts` uses node env, `passWithNoTests:false`, and 15s timeout — stops the studio workspace from inheriting the root `setupFiles: ['src/test/setup.ts']` (which doesn't exist in studio).
  - New `studio/src/compositions/schema.test.ts` — 5 invariants on the canonical scene/composition zod schema (duration bounds, URL validation, default variant, unknown-variant rejection, full-brief acceptance). Pins the contract that every Remotion template + the orchestrator's `script.ts` write against.
  - `marketing-site/` was uninstalled; now installed and Astro builds all 11 pages including the new `/standard/index.html` from S5's second pass.

- **Verification (third pass)**
  - Root: `pnpm tsc --noEmit` clean, `pnpm lint` clean, `pnpm test --run` = **202/202** (was 197), `pnpm build` clean (232.3 KB gzip main).
  - Studio: `pnpm --filter @neurospark/studio typecheck` clean, `pnpm --filter @neurospark/studio test` = **2/2 files, 10/10 tests** passing.
  - Marketing-site: `pnpm --filter marketing-site build` clean — 11 pages, sitemap-index.xml emitted.

## 10-year survivor bets — second-pass deepening (April 2026)
Each survivor now has a parent-facing surface and end-to-end persistence wired. Building on the foundations below.

- **S1 deepening — Coach long memory + rupture-repair, fully product-shaped**
  - `src/app/screens/CoachMemoryScreen.tsx` — read/edit/delete observations, grouped by topic, per-child picker, free-text entry with 800-char clamp + 12 topic chips. Honours `hasFeatureConsent(childId, "coach")` before allowing writes.
  - `src/app/screens/RuptureRepairScreen.tsx` — trigger picker (tantrum / transition / sibling / screen-time / bedtime / other) → server-curated 90s voice script via `POST /coach/rupture` → spoken via Web Speech API w/ Repeat + Next + outcome rating (`calmer | no-change | worse`). Outcome auto-logged as a `rupture-repair` topic memory with weight 1.5 / 1.0 depending.
  - `src/components/coach/CoachPanel.tsx` — accepts `childId`, threads it through to the cloud `generateCoachResponse`, and runs `inferMemorySignal()` on each user message; observation-shaped messages auto-log when consent is granted (silent; never surfaces failure to the parent).
  - `src/components/brain/BrainPanel.tsx` — passes `activeChild.id` into `<CoachPanel/>` so the existing in-region coach call site benefits from long memory.
  - `src/lib/coach/coachEngine.ts` — `CoachRequest` + `generateCoachResponse` now accept `childId`; passed straight through to `/coach`.
  - Profile gets "Coach long memory" entry; Home Quick-Actions gets "Rupture & repair (90s)" tile.

- **S2 deepening — NeuroSpark Audio production polish**
  - `AudioModeScreen` binds the **Media Session API**: sets `metadata` (title / artist=NeuroSpark Audio / album=brain region) and `playbackState`; wires `play / pause / nexttrack / previoustrack / stop` action handlers so AirPods, lock-screen, and car-play surfaces control playback.
  - Adds **Skip** button (cancels current segment, advances; calls `finishRitual` when at the last segment) and **Share with co-parent** affordance (Web Share API → clipboard fallback).
  - Cleans up Media Session handlers on stop so successive rituals don't leak state.

- **S3 deepening — Coach call-site wiring**
  - `generateCoachResponse(profile, scores, options)` now accepts and forwards `childId`. The `/coach` endpoint already injects long-memory server-side; this iteration completes the missing wire.
  - Free-form chat replies still flow through cloud (structured generation needs it). The on-device path stays opt-in via `getProcessingMode()` + per-feature consent. Auto-logged observations are skipped entirely when consent is denied.

- **S4 deepening — Sleep × Cognition surfacing**
  - `src/lib/sleep/sleepClient.ts` — `logSleepNight`, `listSleepNights`, `getLocalSleepMirror`. Writes to Edge + maintains a 14-night `localStorage` mirror so AGE has a `sleepDebtFactor` before any network round-trip.
  - New Edge endpoints `POST /sleep/log` (upserts on `(user_id, child_id, night_date)`, validates bucket + source enums, accepts optional `tzOffsetMin`) and `GET /sleep/list` (RLS-guarded, `?childId=…&limit=14`).
  - `src/app/screens/SleepLogScreen.tsx` — AAP age-band reminder, 7-day debt index, surface-bedtime hint, manual entry (date stepper / hours / minutes / awakenings → bucket), 14-night history coloured by bucket.
  - Profile + Home tiles point to `sleep_log`.

- **S5 deepening — Marketing site `/standard` page**
  - `marketing-site/src/pages/standard.astro` — new public landing page that documents the open `@neurospark/ai-age` standard. Three CTAs (`spec.json`, NPM package, `badge.js`), one-line embed snippet, live verifier-badge preview, why-an-open-standard explainer, and an adopters list. Mirrors existing Astro 5 + Tailwind layout.

- **S6 deepening — Snapshot save + share-token UI**
  - `src/lib/clinical/snapshotClient.ts` — `saveSnapshot`, `listSnapshots`, `listPartnerShares`, `createPartnerShare`, `revokePartnerShare`.
  - New endpoints `POST /snapshot/save` (persists posteriors + region aggregates so the partners endpoint can replay identical numbers; rate-limited 60 / 10 min), `GET /snapshot/list` (last 20 per child), `GET /partners/shares` (last 50, `?childId=…` filter).
  - `src/app/screens/SnapshotScreen.tsx` — picks anchor visit, shows practice volume, generates the PDF locally (existing `downloadSnapshotPdf`) AND saves the data to cloud in one button. Saved snapshots back the `/partners/snapshot-summary` API.
  - `src/app/screens/SnapshotSharesScreen.tsx` — issue (TTL picker 7/14/30/60/90 d), copy (Web Clipboard API → prompt fallback), and revoke pediatrician-share links. Renders the partner-facing URL via `VITE_PARTNERS_BASE_URL` (defaults to `https://partners.neurospark.com/snapshot?token=…`).

- **S7 deepening — Parent-facing coverage**
  - Confirmed `POST /coverage/credit` already enforces `daily_minutes_cap_per_child` (per-partner, per-child, last 24 h) — returns `429 daily_cap_exceeded` with usage + cap.
  - New `GET /coverage/summary?childId=…&hours=24` aggregates today's external coverage credited to children the parent owns (RLS through `coverage_anon_links`). Returns total seconds, per-partner aggregates, and per-event detail.
  - `src/components/coverage/CoverageTodayCard.tsx` mounted on Home above the Seasonal banner. Renders nothing when there's no external coverage (silent for parents whose kids don't yet use any partner). Otherwise shows total minutes + per-partner pill chips.

- **Verification (this iteration)** — `pnpm tsc --noEmit` clean, `pnpm lint` clean, **197/197** vitest passing, root `pnpm build` clean (~218 KB gzip main), admin `pnpm build` clean.

## 10-year survivor bets — first 4-week moves shipped (April 2026)
Tied to `docs/ideation/2026-04-17-next-10-years.md`. Each survivor has a foothold of working code in `main`; the *bet* still needs validation — see "Verification" sections of each survivor doc.

- **Survivor 1 — Companion Coach (long memory + rupture-repair)**
  - `00014_coach_memory.sql` (append-only observation log per child, 180-day TTL, RLS by user_id, weighted by topic)
  - Edge endpoints: `POST /coach/memory`, `GET /coach/memory`, `DELETE /coach/memory/:id`, `POST /coach/rupture` (curated 90-second dyadic-breathing script — always free, ungated)
  - `coach_shared.ts.generateCoachPrompt` injects up to 12 highest-weight observations as `longMemorySection`; quotes back specifics by topic and date
  - Client lib: `src/lib/coach/coachMemory.ts` with `sanitiseObservation` (strips email / phone / SSN-shaped strings, clamps to 800 chars, collapses whitespace)
- **Survivor 2 — NeuroSpark Audio (screen-free mode)**
  - New `audio_mode` AppView + `AudioModeScreen` (voice-led navigation, big-tap controls for the car, Web Speech API playback w/ 5-second pause beats between segments)
  - 15 micro-rituals (`src/lib/audio/microRituals.ts`) — every ritual 90–120 s, age-gated, moment-tagged (car-ride / toothbrush / walk / dinner / bath / bedtime / wakeup / errand / anytime), tagged with brain regions + Open AI-Age competencies
  - Completed rituals call `logActivity` so audio plays earn the same brain-region + competency credit as on-screen plays — coverage accrues whether the child is on a screen or not
  - Home screen surfaces the new "Audio mode (screen-free)" tile
- **Survivor 3 — On-device-first AI (regulatory moat for COPPA 2.0 / EU AI Act)**
  - `src/lib/localAi/index.ts` adapter: processing-mode storage (on-device / hybrid / cloud), per-feature COPPA 2.0 consent (coach / voice-stt / voice-tts / safety / image-gen), force-on-device-only override per child, runtime probe for `@capacitor-community/llm` (constructed via `Function` so Vite never sees a static import), `routedChat` w/ strict on-device + hybrid + cloud routes, `describeLocalStorage` + `purgeChildLocalState` (right-to-delete, returns count)
  - New `AIPrivacyScreen` accessible from Profile → "AI privacy & consent" — shows processing mode, runtime status, per-feature toggles, on-device-only override, what's stored locally for this child, one-tap purge, link to independent verifier
- **Survivor 4 — Sleep × Cognition Loop**
  - `00013_child_sleep_signal.sql` — 4-bucket categorical sleep data (excellent / adequate / short / deficient), per-day per-child, RLS by user_id
  - `src/lib/sleep/sleepSignal.ts` — `bucketFromMinutes` (age-aware), `sleepDebtFactor` (exponentially-weighted 7-day window in [0, 1])
  - `src/lib/sleep/healthBridge.ts` — Capacitor-aware Health bridge (HealthKit on iOS, Health Connect on Android), graceful manual-entry fallback on web
  - `runAGE` accepts a `sleepDebt` option; throttles working-memory-heavy regions (Logical-Mathematical, Linguistic, Spatial-Visual, Digital-Technological) by up to ~22 score points at full debt
- **Survivor 5 — Open AI-Age Standard**
  - New MIT-licensed package: `@neurospark/ai-age` at `packages/neurospark-ai-age/`
    - 12 evidence-grounded competencies (`src/spec.json`) with peer-reviewed citations + age guidance + observable behaviours
    - Reference `scoreInteraction(input)` — deterministic, dependency-free, vendor-portable
    - Semver governance + 90-day breaking-change window
  - Public Edge endpoints: `POST /standard/score`, `GET /standard/spec`, `GET /standard/verify/:product`
  - Vanilla web component `marketing-site/public/badge.js` for partner sites; React wrapper `src/components/standard/NeuroSparkVerified.tsx` for first-party use
- **Survivor 6 — Clinical Wedge (pediatrician + employer benefit)**
  - Bayesian milestone predictor at `src/lib/milestones/bayesianPredictor.ts` — Beta-Binomial posterior over a logistic age prior, conditioned on observed brain-region practice; returns posterior mean, 90 % credible interval, and on/above/below-trajectory verdict per milestone
  - Well-child snapshot generator at `src/lib/clinical/wellChildSnapshot.ts` — anchored to the 9 / 12 / 15 / 18 / 24 / 30 / 36 / 48 / 60-month visits, renders self-contained HTML (print-to-PDF anywhere), mandatory disclaimer footer ("developmental observation, not a clinical diagnosis"), HTML-escapes child name
  - `00015_clinical_wedge.sql`: `well_child_snapshots` (cached posteriors per snapshot) + `partner_snapshot_shares` (parent-issued revocable tokens, default 30-day TTL, max 90)
  - Edge endpoints: `GET /partners/brief` (Maven/Carrot integration spec, returns versioned JSON), `POST /partners/share` (parent issues token), `DELETE /partners/share/:token` (revoke), `GET /partners/snapshot-summary?token=…` (de-identified, EHR-ingestible payload — never exposes raw activity log)
- **Survivor 7 — Coverage-as-a-Protocol**
  - `00012_coverage_partners.sql` — `coverage_partners` (slug, signing secret, per-child daily minutes cap, RPM limit, soft-disable), `coverage_credits` ledger (signed_at, partner_id, child_id, brain_region, competency_ids, modality), `coverage_anon_links` for anonymous siblings
  - HMAC-SHA256-signed `POST /coverage/credit` Edge endpoint with timing-safe verify, partner rate limiting, per-child daily caps
  - Admin endpoints: `GET /admin/coverage/partners`, `POST /admin/coverage/partners` (returns signing secret ONCE, never queryable again), `POST /admin/coverage/partners/:id/rotate`, `POST /admin/coverage/partners/:id/disable`, `GET /admin/coverage/recent`
  - Admin UI: `CoveragePartnersPage` with create / rotate / disable + recent ledger view
  - Node SDK at `packages/coverage-partner-sdk/` (zero-dep, TypeScript) + Lua example for Roblox plugin authors

Verification (this round): `pnpm tsc --noEmit` clean, **197/197 vitest passing**, `pnpm build` succeeds (775 KB main JS, 135 KB CSS, 220 KB gzipped).

## Production readiness (April 2026 build-out) — shipped
- **Admin platform**
  - `supabase/migrations/00010_admin_roles.sql` — admin role + RLS scoping
  - `requireAdmin` middleware on `/admin/*` Edge Function endpoints
  - `admin/` Vite app: Overview, Families, Activities, Subscriptions, AI costs, **Studio** (job list + job detail with scene editor)
- **Analytics warehouse**
  - `etl/sync_supabase.py` mirrors raw Supabase → Neon
  - dbt project (`stg_*` + `marts/*`): DAU, retention cohorts, brain region coverage, AI-age competencies, subscription funnel, marketing attribution, Studio costs
  - `.github/workflows/analytics-nightly.yml` runs full pipeline at 02:00 UTC
- **Marketing automation (n8n on Railway)** — 10 workflows
  - `daily_shorts_factory`, `appstore_play_listings`, `appstore_play_reviews`, `youtube_clipper`, `community_signal_monitor`, `seo_blog_engine`, `weekly_intelligence_newsletter`, `posthog_daily_digest`, `influencer_scraper`, `reddit_listener`
- **Attribution**
  - `src/utils/attribution.ts` (first-touch + last-touch, persisted)
  - Auto-enrichment in `productAnalytics.captureProductEvent`
- **Animated marketing site (Astro 5 + Tailwind + Anime.js v4 + GSAP + Motion + Lenis)**
  - 10 pages incl. `/`, `/features`, `/science`, `/ai-age`, `/pricing`, `/download`, `/about`, `/blog`, `/privacy`, `/terms`
  - `<Reveal>`, `<HeroOrb>` (Anime.js + GSAP ScrollTrigger), `<BrainMap>` (Motion), Lenis smooth scroll
  - Cloudflare Pages config (`wrangler.toml`, `_headers` security + CSP, `robots.txt`) + Lighthouse-CI gate ≥0.92 perf/0.95 a11y/best-practices/SEO + GitHub Action `marketing-site.yml`
- **AI Video Studio**
  - `automation/image-svc` Hono service with **17 image providers** + smart router (`textInImage` → Ideogram/Recraft, `brandConsistency=high` → SDXL self-host/FLUX pro, `preferStock` → Pexels)
  - `automation/video-svc` Hono service with **18 video providers** (Sora 2 / Veo 3 / Runway Gen-4 / Luma Ray 2 / Kling 2.1 / Pika 2.2 / MiniMax Hailuo 02 / ByteDance Seedance / Alibaba Wan 2.5 / Replicate / fal + self-hosted Hunyuan / LTX / Mochi / CogVideoX / Open-Sora / SVD / AnimateDiff)
  - `automation/voice-svc-kokoro` FastAPI proxy (self-hosted on Railway)
  - `studio/` Remotion 4 orchestrator + 6 brand templates + PgBoss queue + `studio_cost_ledger` cost cap + brand-safety guard (`pipeline/safety.ts` w/ Replicate NSFW classifier)
  - Admin Studio UI: storyboard review, per-scene provider override, approve & render, cancel, MP4 download
- **Verification**
  - Root: `pnpm tsc --noEmit` clean
  - Root: **150/150 vitest passing across 31 files** (incl. new `attribution.test.ts`)
  - New per-service test files: `image-svc/router.test.ts` (8 cases), `video-svc/router.test.ts` (8 cases), `studio/safety.test.ts` (5 cases)
- **Docs**
  - `PRODUCTION_ACCESS.md` — credentials/provisioning checklist for 110% production readiness
  - `IN_APP_ANIMATION_PLAN.md` — surface-by-surface motion design with bundle budget, hooks, and 5-day phasing
  - `FUTURE_ROADMAP.md` updated implementation snapshot

## Already shipped recently
- Privacy-light analytics and optional Supabase ingest
- Playwright smoke E2E and CI integration
- COPPA/GDPR engineering checklist
- Environment/staging docs
- Optional Sentry setup
- Local backup/export + restore flow
- Supabase auth lifecycle hardening
- Legal/refunds draft screens and publishing checklist
- Responsive app shell + lazy-loaded screen chunks
- Unit/component/E2E coverage expansion with seeded flow tests
- PWA install assets, service worker, offline UX, and install CTA
- Richer activity metadata, adaptive outcome-pillar focus, and AGE simulation script
- Prompt/media orchestration scaffolding and content validation tooling
- Release, threat-model, performance-budget, moat, and offline docs
- Brain map interactive visualization with SVG, AI insights, coaching panel, canvas rendering
- Brain-canvas responsive pan/pinch zoom
- **All 18 Ultra Features implemented:**
  1. AI Activity Adaptation (on-device adaptive engine, integrated into AGE scoring and logActivity)
  2. Weekly Intelligence Report (15-region coverage report, data builder, PDF-ready screen)
  3. Sibling Collaboration Mode (multi-child activity matching, role assignment, collab logging)
  4. Voice Instruction Mode (Web Speech API narration for activities, per-step and full narration)
  5. 30-Language Support (i18n context/provider, 31 locale JSON files + English, language settings screen)
  6. Creation Portfolio (image capture, compression, auto-tagging, developmental stage inference, gallery screen)
  7. Parent Coaching Mode (activity-level coaching overlay with timer, region-based guidance, /coach endpoint extension)
  8. Seasonal Activity Library (season detection, seasonal scoring in AGE, seasonal banner on home, dedicated screen)
  9. Sensory Modification Engine (sensory profiles, condition-based material/instruction adaptation, settings screen)
  10. Community Activity Ratings (client scorer, CommunityBadge, AGE integration, Postgres aggregation migration)
  11. Developmental Milestone Predictor (trajectory analysis, PredictorCard on HomeScreen, 17 developmental milestones)
  12. Sleep & Routine Optimizer (activity windows by time-of-day, daily schedule component, routine config screen)
  13. Parent-Child Bonding Tracker (weekly bonding scores, joy moments, history, tips, dedicated screen)
  14. Gamified Achievement System (daily/weekly/monthly quests, enhanced streaks with freezes, QuestBoard)
  15. Offline Activity Packs (IndexedDB storage, sync queue, pack manager)
  16. Multi-Caregiver Mode (role-based access, invite codes, caregiver management screen, Postgres migration)
  17. AI-Powered Progress Narratives (weekly narrative component, GPT-4o integration, narrative cache)
  18. Smart Notification System (smart scheduler, usage pattern learning, notification settings screen)
- **Infrastructure:**
  - Premium check utility (`src/lib/subscription/premiumCheck.ts`)
  - 3 new SQL migrations: portfolio (00004), caregivers (00006), narrative_cache (00007)
  - 3 new edge function endpoints: `/narrative/generate`, `/ml/aggregate`, `/report/email`
  - 20 additional locale files (31 total) covering all blueprint languages
- **APK built successfully:**
  - Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk` (6.3 MB)
  - Release APK: `android/app/build/outputs/apk/release/app-release-unsigned.apk` (5.3 MB)

## Verification status
- `pnpm run verify` passes: typecheck + lint (0 warnings) + 81 tests + build.
- Capacitor Android sync succeeds.
- Both debug and release APKs build successfully.

## FUTURE_ROADMAP — implemented in this iteration
- **Phase A — AI-Age Readiness UI**
  - 12-dimension `CompetencyRadar`, `CompetencyDetailModal`, `CompetencyBadges`, `TodaysFocusChip` mounted on Home, Brain Map ("AI-Age" tab), Generator pack cards, and Activity Detail.
  - Activity logs now persist `competencyTags` so weighting can be retrained from history.
- **Phase B — Weekly Intelligence Report**
  - `weeklyReportData` exposes `competencyCoverage` (sorted weakest-first) and `competencyFocus` (next-week's two priorities); rendered as a new section in `ReportScreen` PDF view.
- **Phase D — Adaptive engine**
  - `AdaptiveModel.competencyWeights` learned from per-tag engagement (≥3 samples), wired into `runAGE` via a small ±12-point bonus alongside region weights.
  - Helper `getAdaptiveCompetencyBonus` exported for future callers.
- **Phase F — Family AI-Hygiene tour**
  - Three-screen onboarding tour at first activity + 30-day refresher (`AIHygieneTour`), with localStorage flag persistence.
- **Voice (Conversational)**
  - Adapter pattern (`VoiceAdapter` + `WebVoiceAdapter` + `NativePluginAdapter` stub).
  - `VoiceSession` FSM (idle/listen/think/speak/error), `useVoiceSession` hook, `ConversationButton`, `VoiceSettingsCard` mounted on Profile.
  - Edge endpoint `POST /voice/turn` streams replies via SSE (gpt-4o-mini) with per-user rate limit.
- **Notifications, Cloud Sync, Caregiver invites, Premium entitlement**
  - Profile settings cards (`NotificationSettingsCard`, `CloudSyncCard`).
  - Edge endpoints: `/sync/state` (push+pull, optimistic versioning), `/caregivers/invite`, `/caregivers/accept`, `/billing/entitlement` — all behind `requireUser` + rate limits.
  - SQL migration `00009_sync_state.sql` for the future Postgres-backed state blob.
  - Cross-device caregiver flow added to `CaregiversScreen`.
- **Offline Pack & Telemetry**
  - `OfflinePackButton` on Home — saves pack to IndexedDB and asks the service worker to prefetch image assets via `PREFETCH_PACK_ASSETS`.
  - Product analytics refactored to a batched sink with `sendBeacon` fallback on `pagehide` / `visibilitychange`.
- **Tests**
  - New unit suites: `voiceSession.test.ts` (FSM transitions + barge-in + error auto-reset), `cloudSync.test.ts` (push/pull/error/jwt fallback), `adaptiveEngine.competency.test.ts` (training thresholds + nudge sign), and an additional `weeklyReportData` case for the 12-dim rollup.
  - Full suite: **138 tests / 28 files passing**, `pnpm tsc --noEmit` clean.

## Gap-fix pass (FUTURE_ROADMAP §1.2 closure)

The audit pass after the AI-Age Readiness rollout caught a handful of items
that had infrastructure shipped but no UI / no auto-trigger / no content. All
fixed in this iteration:

- **Cloud sync auto-push** — `AppContext` now debounces a `pushStateNow`
  whenever the persisted state mutates, opt-in is enabled, and a Supabase
  JWT is available. The previous build only pushed on the manual "Sync now"
  button.
- **Magic-link `/invite?token=…` route** — `App.tsx` parses the URL on boot,
  stashes the token in `sessionStorage`, and dispatches a custom event;
  `CaregiversScreen` consumes the pending token on mount and auto-calls
  `acceptCaregiverInvite` so cross-device caregiver onboarding works from
  a single tap on the email link.
- **`ConversationButton` mounts** — wired into `AICounselorScreen` (dictate
  the concern hands-free) and `CoachChat` (hands-free coach Q&A). The
  previous build had the FSM, hook, and visual all complete but mounted
  nowhere.
- **`/voice/turn` SSE client** — new `voiceTurnClient.ts` parses the SSE
  stream and emits per-token + final-text events with a 3-test unit suite.
- **Server entitlement consumption** — new `useEntitlement()` hook fetches
  `/billing/entitlement` on mount + auth-change + visibility, and the
  Brain panel now treats premium as `entitlement.isActive ||
  hasCreditForToday()` so a real subscription bypasses the local credit
  pump but the offline fallback stays correct.
- **Native local notifications** — `notificationChannel.ts` now does a
  runtime discovery of `Capacitor.Plugins.LocalNotifications`; both
  `sendLocalNotification` and a new `scheduleLocalNotificationAt` route to
  the native plugin when bridged, web fallback otherwise. 4-test unit
  suite covers both paths.
- **Phase C content (15 new AI-age activities)** — authored a76–a90,
  every one citation-grounded, covering long-horizon agency (a76–a80),
  ethical judgment (a81–a84), lateral source evaluation (a85–a88), and
  metacognitive self-direction (a89–a90).
- **Phase E "Why this matters in the AI age"** — new optional `whyAIAge`
  string on the `Activity` interface, backfilled on all 5 seed activities
  + all 15 new ones, surfaced as a dedicated card on `ActivityDetailScreen`.

Updated test status: **145 tests / 30 files passing**, `pnpm tsc --noEmit`
clean, lints clean.

## Remaining for full production deployment
- Sign the release APK with a production keystore for Play Store submission
- Deploy Supabase migrations to production database
- Configure production secrets (OpenAI API key, Razorpay keys, Resend for email)
- Deploy edge functions to production Supabase
- Set up Google Cloud TTS API for premium voice mode
- Human-review translations for accuracy in all 30 languages

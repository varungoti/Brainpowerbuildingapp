# Active Context

## Current state
**FUTURE_ROADMAP cross-cutting closures (Apr 2026, night +3, +follow-up #5).** Six strictly-scoped closures stacked back-to-back, **§1.2.I "Cross-cutting hardening" is now fully closed**:

0. **Auth + onboarding + first-activity loop — Playwright E2E (§1.2.I closing item).** New `tests/e2e/auth-onboarding-first-activity.spec.ts` drives a real production build through landing → AuthScreen signup → OnboardingScreen (welcome → child → materials → ready) → "Generate First Activities" → home → Today → "Generate My Pack" → expand activity → "Open full detail" → back → "Mark as Complete" → "Done! +XX BP" — and asserts the *captured* funnel stream end-to-end: presence (`auth_view` / `auth_submit_attempt(dwell_ms:number)` / `auth_submit_success` / `onboard_step_view × 4 across welcome|child|materials|ready` / `onboard_complete(screen:"onboard_ready")` / `activity_open(is_first_activity:true)` / `first_activity_open` / `activity_complete(is_first_activity:true)` / `first_activity_complete`), strict order (`auth_view → auth_submit_success → onboard_complete → first_activity_open → first_activity_complete`), and per-event uniqueness (`first_activity_open` and `first_activity_complete` each fire exactly once). To enable assertions without an HTTP sink, `captureProductEvent` now also dispatches each payload on a `neurospark:product_event` `CustomEvent` (one allocation/event, zero-listener cost in production); the spec subscribes via `page.exposeFunction` + `addInitScript`. Build path uses the existing `VITE_E2E_SUPPRESS_SB_CLIENT=true` escape hatch so the spec is deterministic on developer machines that have a real Supabase project provisioned (otherwise the email-confirmation branch would block the funnel). The spec also pre-seeds `credits: 3` (only that field) into `neurospark_v2` so the brand-new account isn't sent straight to the paywall when generating its first pack. New spec passes locally (1/1).

1. **Auth/onboarding/first-activity telemetry + Sentry/PostHog remote-flag wiring (§1.2.I).** Two more §1.2.I bullets struck. Funnel side: new events `auth_view`, `auth_submit_attempt/success/fail` (with bucketed `fail_reason`), `onboard_step_view` (per `welcome|child|materials|ready` step), `onboard_complete`, `activity_open`, `first_activity_open`, `first_activity_complete` plus an `is_first_activity` flag on `activity_complete`. `AppContext.logActivity` derives the first-activity flag from `pRef.current.activityLogs` BEFORE committing the new entry, so it's unambiguous. Supabase auth errors are bucketed via `classifySupabaseAuthError` so PostHog never sees emails/IPs. Sink side: Sentry init now respects a `monitoring_kill` feature flag (set `VITE_FEATURE_FLAGS=monitoring_kill` to disable without redeploying). New zero-dep `src/utils/posthogForwarder.ts` posts to PostHog's `/i/v0/e/` batch endpoint when all of `PROD` + `VITE_POSTHOG_KEY` + `posthog` flag are present, anonymous `crypto.randomUUID()` distinct_id persisted to localStorage. 16 new vitests cover env gating, host override, fetch-throws safety, distinct_id persistence, batch wire format, kill switch, and the new event taxonomy. Suite **279/279**, `tsc` + `lint` clean.

2. **WCAG AA contrast pass on BrainCanvas surfaces (§1.2.I).** Audit found two real failures — `BrainTooltip` percent pill (slate-900 on `#7A69E8` indigo = 4.26:1, fails AA) and `BrainLegend` percent pill (region color on 13%-alpha tint of itself, fails AA badly for every light pastel). Built `src/lib/brain/contrast.ts` with WCAG 2.1 primitives (`relativeLuminance`, `getContrastRatio`, `getReadableTextOn`, `compositeOver`) plus a higher-level `getAccessiblePillStyle(bg)` that auto-adjusts the background in 5% steps until ratio ≥ 4.5 when no plain text choice works. `BrainTooltip` now uses the helper (the indigo gets darkened just enough to clear AA with white text); `BrainLegend` switches to fixed slate-700 (`#334155`) on the tint, which passes AA against all 15 region colors. New `contrast.test.ts` adds **52 vitests** including parametric per-region passes that will fail loudly on any palette regression. Suite **263/263**, `tsc` + `lint` clean.

2. **Voice adapter — community Capacitor plugins now wired.** `nativeVoiceAdapter.ts` previously only knew about the in-house `NeuroSparkVoice` plugin (not yet built). New `CommunityPluginAdapter` composes `@capacitor-community/text-to-speech` and/or `@capacitor-community/speech-recognition` (whichever are present on `window.Capacitor.Plugins`) with `WebVoiceAdapter` for missing primitives. `pickAdapter()` priority: NeuroSparkVoice (full-stack) → community (partial) → web. STT path runs the real plugin dance: `available()` → optional `checkPermissions()` + `requestPermissions()` → `addListener("partialResults")` for partial transcripts → `start()` for the final transcript. TTS maps text/locale/rate/pitch directly. 9 new jsdom vitests in `nativeVoiceAdapter.test.ts` exercise every branch. Suite **211/211** (was 202; +9), `pnpm tsc --noEmit` clean, `pnpm lint` clean.

2. **Sync state KV → Postgres migration.** `/sync/state` was KV-only despite `00009_sync_state.sql` having shipped. Migrated `postSyncState` + `getSyncState` in `supabase/functions/server/index.tsx` to Postgres-first (`public.user_sync_state` with optimistic versioning). KV stays as a one-time read fallback (lazy-hydrates Postgres on next pull, so devices last synced under the KV-only path don't lose their blob) AND as a write fallback when Postgres is unreachable (single-region availability). Wire contract unchanged → `cloudSync.ts` + its 8 tests untouched. Roadmap §1.0 open-follow-ups list updated to strike this item.

3. **AI-Age Readiness v1 §0.8 definition-of-done closed.** §0.8 checklist still showed Phase A–F unchecked despite all six having shipped, AND `ai-literacy-cocreation (deep)` was 1/5 of its §0.5 Phase C target — only `a74` was a true supervised co-creation project (a73/a75/a86 only touched the topic). Closure pass:
- Authored 4 genuine end-to-end co-creation rituals: `a91` Co-Design a Birthday Card, `a92` Lego from an AI Plan, `a93` Co-Compose a 30-Second Song, `a94` Plan a Real Outing. Each carries `competencyTags`, `whyAIAge`, evidence-cited `parentTip`, child-owned artefact, and an explicit "where did the AI miss what we meant?" debrief — i.e. they're rituals, not topic-touches.
- Updated `docs/FUTURE_ROADMAP.md` §0.8 to reflect actual ship state (engine + Phase A/B/C/D/E/F all ✅), §1.0 snapshot test count corrected from 145/145 to 202/202, and gap-fix table extended with the a91–a94 row.
- `pnpm tsc --noEmit` clean; `pnpm test --run` → 202/202 vitest passing across 38 files. The catalogue now exposes 24 AI-age authored activities (a71–a94) plus 70 legacy auto-tagged ones.

**Previous state — fourth-pass shipped (Apr 2026, night +2).** Two moves on top of the third pass:
- **Code-splitting pass.** `src/app/App.tsx` now `React.lazy()`s 24 tail-traffic screens behind a `<Suspense>` boundary with a `LazyScreenFallback`. Critical-path screens (Landing/Auth/Onboarding/Home/Generator/History/Profile/AddChild/Paywall/BrainMap/ActivityDetail/AICounselor) stay eager. Result: **main bundle 232 → 164 KB gzip (-29%)**, chunk-size warning gone, and 24 chunks each <25 KB gzip — tail screens load on demand. Zero behaviour change; all 202 vitests + lint + tsc still clean.
- **Survivor 3 brainstorm.** New `docs/ideation/2026-04-18-survivor-3-on-device-brainstorm.md` — picks **WebLLM + Llama-3.2-1B-Instruct-q4f16_1** for web/PWA and **`@capacitor-community/llm` + Phi-3.5-mini-Q4** for Capacitor native, with a 4-phase build plan (Phase 0 already shipped via the third pass), explicit kill criteria, a public `/verifier` page that any third party can replay, and the unlock map showing why this bet is the prerequisite for S1's long-memory variant + S2's audio-only mode + S6's pediatrician trust footer. Treats the **COPPA 2.0 effective Apr 22, 2026 (4 days from this brainstorm)** as the forced-move trigger.

**Previous state — third-pass deepening (Apr 2026, evening +1).** On top of the second-pass surfaces:
- **S3 (On-device-first)** now has a real WebGPU/WebLLM probe in `src/lib/localAi/index.ts` — `hasWebGpu()` + `probeWebLlm()` + `getOrInitWebLlmEngine()` lazily resolve `@mlc-ai/web-llm` via dynamic `Function("import")` so the web bundle stays slim if the package isn't installed. `routedChat` now tries the native Capacitor plugin first, then WebLLM, before falling back to cloud. `getLocalRuntimeStatus` reports the real `modelName`/`bundleSizeMb` for whichever runtime won the probe.
- **S1 (Companion Coach)** UI now surfaces long-memory transparency — `CoachPanel` renders a "🧠 Remembering N observations about {name}" chip whenever consent is on and at least one observation exists. Auto-logged observations bump the count optimistically.
- **Workspaces** — `studio/` and `marketing-site/` are both installed + green for the first time end-to-end. New `studio/vitest.config.ts` so the studio workspace stops inheriting the root setupFiles. New `studio/src/compositions/schema.test.ts` covers the 5 invariants of the canonical scene/composition contract. `marketing-site` build emits all 11 pages including the new `/standard/index.html`.
- **Verification** — root: **202/202 vitest** (was 197 — added 5 WebLLM probe tests), `pnpm tsc --noEmit` clean, `pnpm lint` clean, `pnpm build` clean. Studio: typecheck clean, **2/2 test files** + **10 tests passing**. Marketing-site: full Astro build clean (11 pages).

**Previous state — second-pass deepening (Apr 2026).** Each of the 7 survivors now goes from "first 4-week move" to a parent-facing surface end-to-end. New code: (S1) `CoachMemoryScreen` + `RuptureRepairScreen` + auto-log of observation-shaped messages from `CoachPanel` (gated on per-feature consent) + `childId` threaded through `generateCoachResponse` → `/coach`. (S2) `AudioModeScreen` now binds the **Media Session API** (lock-screen / car-play metadata + play/pause/skip/prev/stop handlers), adds a Skip button, and a Web-Share-API "share with co-parent" affordance. (S3) `routedChat` already exposes consent-aware on-device routing; the cloud coach call site now passes `childId` so server-side long memory injection actually fires. (S4) `SleepLogScreen` + `sleepClient.ts` + new Edge endpoints `POST /sleep/log` + `GET /sleep/list`; `sleepDebtFactor` is read locally from a 14-night mirror so AGE has signal pre-network. (S5) `marketing-site/src/pages/standard.astro` — public landing page that embeds the `badge.js` verifier + spec/library links + adopters CTA. (S6) New `POST /snapshot/save` + `GET /snapshot/list` + `GET /partners/shares` endpoints back two new screens (`SnapshotScreen`, `SnapshotSharesScreen`) so parents can persist snapshots, manage revocable pediatrician-share links, and copy the partner URL. (S7) New `GET /coverage/summary` aggregator + `CoverageTodayCard` Home tile that surfaces external coverage credited in the last 24 h (silent when 0). Root: **197/197 vitest passing**, `pnpm tsc --noEmit` clean, `pnpm lint` clean, `pnpm build` succeeds, admin build clean.

## Just completed (this iteration — survivor deepening)
- **S1 — Coach memory UI + auto-log**
  - `src/app/screens/CoachMemoryScreen.tsx` (parent reads/edits/deletes long memory, grouped by topic, with topic-tag chips and per-child picker).
  - `src/app/screens/RuptureRepairScreen.tsx` (trigger picker → 90-second voice script with Web Speech API + per-step Repeat/Next + outcome rating that logs to long memory).
  - `src/components/coach/CoachPanel.tsx` now (a) accepts `childId`, (b) passes it to `generateCoachResponse` so the server-side long-memory injection fires, (c) auto-logs observation-shaped user messages via `inferMemorySignal()` (heuristic topic classifier; weights 0.8–1.6) gated on `hasFeatureConsent(childId, "coach")`.
  - `src/components/brain/BrainPanel.tsx` now passes `activeChild.id` into `<CoachPanel/>` so memory threads through the existing call site.
- **S2 — Audio mode polish**
  - `AudioModeScreen` binds the **Media Session API** (`navigator.mediaSession.metadata` + play/pause/nexttrack/previoustrack/stop handlers) so the parent can control the ritual from the lock screen, AirPods, or car-play UI.
  - Adds Skip button (cancels current segment, advances), Share button (Web Share API → clipboard fallback), and unbinds the Media Session on stop so it doesn't leak across rituals.
- **S3 — Coach call-site wiring**
  - `generateCoachResponse(profile, scores, options)` now accepts and forwards `childId`; `coachEngine.ts` was the missing wire.
  - Free-form chat replies still flow through the cloud coach (structured generation needs it); the on-device path remains opt-in via `getProcessingMode()` + `hasFeatureConsent`. Auto-logged observations are skipped entirely when consent is denied.
- **S4 — Sleep × Cognition surfacing**
  - `src/lib/sleep/sleepClient.ts` writes/reads through Edge endpoints with a 14-night `localStorage` mirror so cold-start AGE always has a debt signal.
  - New endpoints `POST /sleep/log` + `GET /sleep/list` upsert into `child_sleep_signal` with conflict-resolution on `(user_id, child_id, night_date)`.
  - `src/app/screens/SleepLogScreen.tsx` shows the AAP recommendation for the child's age band, the 7-day debt index, "today's plan will surface bedtime co-regulation" hint, manual entry (date / hours / minutes / awakenings → bucket), and the last 14 nights coloured by bucket.
- **S5 — Marketing site `/standard` page**
  - `marketing-site/src/pages/standard.astro` documents the open `@neurospark/ai-age` standard with three CTAs (spec.json, NPM package, badge.js), a one-line embed snippet, a live verifier-badge preview, and an adopters list. Mirrors the existing Astro 5 + Tailwind layout used by `ai-age.astro`.
- **S6 — Snapshot UI + share-token management**
  - `src/lib/clinical/snapshotClient.ts` (`saveSnapshot`, `listSnapshots`, `listPartnerShares`, `createPartnerShare`, `revokePartnerShare`).
  - New endpoints `POST /snapshot/save` + `GET /snapshot/list` + `GET /partners/shares`. Save persists the same numbers the PDF shows so partners replay an identical snapshot.
  - `src/app/screens/SnapshotScreen.tsx` shows the anchor visit, practice-volume metrics, and a one-tap "Generate PDF + save snapshot" button.
  - `src/app/screens/SnapshotSharesScreen.tsx` issues, copies, and revokes pediatrician-share links via `partners.neurospark.com/snapshot?token=…`.
- **S7 — Parent-facing coverage**
  - Verified `POST /coverage/credit` already enforces the per-partner-per-child daily-minutes cap (429 + `daily_cap_exceeded`).
  - New `GET /coverage/summary?childId=…&hours=24` aggregates today's credits by partner, RLS-guarded through `coverage_anon_links` ownership.
  - `src/components/coverage/CoverageTodayCard.tsx` is mounted on Home above the Seasonal banner; it renders nothing if there's no external coverage, otherwise shows total minutes + per-partner breakdown chips.
- **Profile + Home wiring**
  - Profile gets four new entries (Coach long memory, Sleep × cognition, Well-child snapshot, Pediatrician share links).
  - Home Quick-Actions adds Rupture & repair, Sleep × cognition tiles.
  - `AppView` extended with `coach_memory | rupture_repair | sleep_log | snapshot | snapshot_shares`; `viewConfig.ts` titles + nav routing wired; `App.tsx` switch-case renders all five screens.
- **Verification** — `pnpm tsc --noEmit` clean, `pnpm lint` clean, **197/197** vitest, root `pnpm build` clean (217 KB gzip main), admin `pnpm build` clean.

## Earlier this iteration
**Production-readiness build-out (April 2026) complete + Postiz distribution layer adopted.** On top of the FUTURE_ROADMAP work, this iteration shipped six new pillars: (1) **Admin backend** at `/admin/*` Edge endpoints + `admin/` Vite app + `00010_admin_roles.sql` + Neon dbt warehouse with 7 marts and a nightly GitHub Action, (2) **AI Marketing automation** = self-hosted n8n on Railway with **10 workflows** + `utm_*`/`ns_*` attribution wired through `productAnalytics`, (3) **Animated marketing site** in Astro 5 + Tailwind + Anime.js v4 + GSAP + Motion + Lenis with Lighthouse-CI gate ≥0.92 and Cloudflare Pages deploy, (4) **AI Video Studio** = Remotion 4 orchestrator with **17 image providers + 18 video providers** routers, Kokoro-FastAPI voiceover, brand-safety guard, PgBoss cost-capped queue, and admin Studio UI, (5) **Daily Shorts Factory** n8n workflow that auto-generates and distributes one short per day to IG/TikTok/YT Shorts, (6) **Postiz** as the canonical social-distribution arm — Docker/Railway stack at `automation/postiz/`, embedded in the admin app under "Social publishing" via secure server-side proxy, called from n8n via the new reusable `lib/postiz_publish` sub-workflow, and from the Studio orchestrator via the new `automation/postiz/lib/postizClient.ts` and `POST /studio/jobs/:id/publish` endpoint. `daily_shorts_factory`, `youtube_clipper`, and `seo_blog_engine` now publish through Postiz (Buffer kept as `USE_POSTIZ=false` fallback). Root app: **150/150 vitest passing**, `pnpm tsc --noEmit` clean. Admin: typecheck + build clean. New/updated docs: `PRODUCTION_ACCESS.md`, `IN_APP_ANIMATION_PLAN.md`, `POSTIZ_EVALUATION.md`, `automation/postiz/README.md`, `automation/n8n/README.md`.

## Just completed (this iteration — 10-year survivor bets)
- **Survivor 1 (Companion Coach)** — `00014_coach_memory.sql` (append-only observations, 180-day TTL, RLS by user_id), Edge endpoints `POST/GET/DELETE /coach/memory` + `POST /coach/rupture` (curated 90s dyadic-breathing script, always free), `generateCoachPrompt` injects up to 12 weighted observations as long-memory context, client utilities `src/lib/coach/coachMemory.ts` with `sanitiseObservation` (strips email/phone/SSN before upload).
- **Survivor 2 (NeuroSpark Audio)** — new `audio_mode` AppView + `AudioModeScreen` (voice-led, big-tap controls), 15 micro-rituals catalog at `src/lib/audio/microRituals.ts` (90–120 s each, all 16 brain regions, all major moments: car-ride / toothbrush / walk / dinner / bath / bedtime / wakeup / errand), Web Speech API playback with parent-pause beats, completed rituals call `logActivity` so audio plays earn the same brain-region credit as on-screen plays.
- **Survivor 3 (On-device-first AI)** — `src/lib/localAi/index.ts` adapter (processing-mode storage, COPPA-2.0 per-feature consent, runtime probe for `@capacitor-community/llm`, `routedChat` with strict on-device + hybrid + cloud routes, `purgeChildLocalState` for COPPA 2.0 right-to-delete), new `AIPrivacyScreen` accessible from Profile → "AI privacy & consent" — shows processing mode, per-feature toggles, on-device-only override, what's stored locally, and a one-tap purge.
- **Survivor 4 (Sleep × Cognition Loop)** — `00013_child_sleep_signal.sql` (4-bucket categorical: excellent/adequate/short/deficient), `src/lib/sleep/{sleepSignal,healthBridge}.ts` (Capacitor-aware HealthKit/Health Connect bridge with manual-entry fallback), `runAGE` now accepts `sleepDebt` and throttles working-memory-heavy regions (Logical-Math, Linguistic, Spatial-Visual, Digital-Tech) by up to ~22 score points at full debt.
- **Survivor 5 (Open AI-Age Standard)** — new MIT-licensed package `@neurospark/ai-age` at `packages/neurospark-ai-age/` (12 evidence-grounded competencies, reference scoring fn, semver governance), public Edge endpoints `POST /standard/score` + `GET /standard/spec` + `GET /standard/verify/:product`, vanilla web component `marketing-site/public/badge.js` for partner sites, React wrapper `src/components/standard/NeuroSparkVerified.tsx`.
- **Survivor 6 (Clinical Wedge)** — Bayesian milestone predictor at `src/lib/milestones/bayesianPredictor.ts` (Beta-Binomial posterior + 90 % credible interval + on/above/below verdict using a logistic prior + practice-driven likelihood), well-child snapshot generator at `src/lib/clinical/wellChildSnapshot.ts` (HTML → print-to-PDF, anchored to the 9/12/15/18/24/30/36/48/60-month visits, full disclaimer footer), new `00015_clinical_wedge.sql` (`well_child_snapshots` + `partner_snapshot_shares` w/ revocable tokens), Edge endpoints `GET /partners/brief` (Maven/Carrot integration spec), `POST /partners/share`, `DELETE /partners/share/:token`, `GET /partners/snapshot-summary?token=…` (de-identified, EHR-ingestible).
- **Survivor 7 (Coverage-as-a-Protocol)** — `00012_coverage_partners.sql` (`coverage_partners` w/ signing secret + per-child rate limit, `coverage_credits` ledger, `coverage_anon_links`), HMAC-SHA256-signed `POST /coverage/credit` Edge endpoint w/ timing-safe verify, admin `/admin/coverage/*` endpoints + `CoveragePartnersPage` (create / rotate / disable + recent ledger), Node SDK at `packages/coverage-partner-sdk/` w/ `roblox-plugin.lua` example.

## Earlier this iteration
- **Admin backend** — `00010_admin_roles.sql` (admin role + RLS), `requireAdmin` middleware on `/admin/*` Edge endpoints, full `admin/` Vite app (TanStack Query, hash routing) with pages for Overview, Families, Activities, Subscriptions, AI costs, Studio, and Studio job detail.
- **Neon ETL + dbt** — `etl/sync_supabase.py` mirrors raw tables; dbt project (`stg_*` + `marts/*`) builds DAU, retention cohorts, brain region coverage, AI-age competencies, subscriptions funnel, marketing attribution, and Studio costs. Nightly `analytics-nightly.yml` Action runs it against `prod`.
- **n8n marketing OS** — 10 workflows shipped (`daily_shorts_factory`, `appstore_play_listings`, `appstore_play_reviews`, `youtube_clipper`, `community_signal_monitor`, `seo_blog_engine`, `weekly_intelligence_newsletter`, `posthog_daily_digest`, `influencer_scraper`, `reddit_listener`) + Railway/Docker deploy.
- **Attribution** — new `src/utils/attribution.ts` (first-touch + last-touch persisted in localStorage); `App.tsx` calls `captureAttributionFromUrl()` on boot; `productAnalytics.captureProductEvent` auto-enriches every event.
- **Marketing site** — Astro 5 scaffold with 8 animated pages (`/`, `/features`, `/science`, `/ai-age`, `/pricing`, `/download`, `/about`, `/blog`, plus `/privacy`, `/terms`); reusable `<Reveal>`, `<HeroOrb>` (Anime.js + GSAP ScrollTrigger), `<BrainMap>` (Motion). Cloudflare Pages config (`wrangler.toml`, `_headers`, `robots.txt`) + Lighthouse-CI gate (`lighthouserc.json`) + GitHub Action (`marketing-site.yml`).
- **AI Video Studio** — `automation/image-svc` (17 providers w/ smart router incl. Ideogram/FLUX/Recraft/SDXL/ComfyUI/stock), `automation/video-svc` (18 providers incl. Sora 2 / Veo 3 / Runway Gen-4 / Luma / Kling / Pika / MiniMax / self-hosted Hunyuan/LTX/Mochi/CogVideoX/Open-Sora/SVD/AnimateDiff), `automation/voice-svc-kokoro` (FastAPI proxy), Remotion `studio/` with 6 brand templates and PgBoss queue + `studio_cost_ledger` + admin UI for storyboard review/approval/distribution.
- **Brand-safety guard** — `studio/server/pipeline/safety.ts` calls Replicate NSFW classifier with a configurable threshold (`NSFW_THRESHOLD`, fail-open).
- **In-app animation plan** — new `docs/IN_APP_ANIMATION_PLAN.md` defines surface-by-surface motion design with bundle budget (<40 KB on critical path), `useReveal`/`useStagger`/`lazyAnime`/`lazyGsap` hooks, `prefers-reduced-motion` discipline, and 5-day implementation phases.
- **Postiz adoption** — `docs/POSTIZ_EVALUATION.md` (verdict: adopt as distribution layer; AGPL OK because we consume via API only). Stack at `automation/postiz/` (Compose + Dockerfile + Railway config + .env.example + README with Caddy/Nginx CSP guidance). Reusable n8n sub-workflow `automation/n8n/workflows/lib/postiz_publish.json`. `daily_shorts_factory`, `youtube_clipper`, and `seo_blog_engine` swapped from Buffer/direct-API to Postiz. Admin app gets new "Social publishing" tab (`admin/src/pages/social/SocialPage.tsx`) backed by 3 server-side endpoints (`GET /admin/postiz/{status,summary}` + `ANY /admin/postiz/proxy/*`, audit-logged). Studio job detail gets a `<PostizPublishButton>` for one-click multi-channel publish. Studio orchestrator gets `POST /studio/jobs/:id/publish` and a typed client at `automation/postiz/lib/postizClient.ts` (zero-dep, fetch-only).

## Pre-existing state (FUTURE_ROADMAP pass)
FUTURE_ROADMAP.md implementation pass complete. AI-Age Readiness UI, Conversational Voice infrastructure, Cloud Sync, Caregiver invites, Notifications & Premium entitlement endpoints, Offline pack download, batched telemetry, and adaptive `competencyWeights` are all wired end-to-end.

## Just completed (this iteration)
- **Phase B PDF rollup** — `ReportScreen` renders the 12-dim AI-Age coverage block (sorted weakest-first) plus a "Next week's focus" amber callout sourced from `weeklyReportData.competencyFocus`.
- **Phase D adaptive engine** — `AdaptiveModel.competencyWeights` learned from per-tag engagement (≥3 samples). `runAGE` now adds a competency-weight nudge alongside region weights; `getAdaptiveCompetencyBonus` exported for future callers; logs persist `competencyTags` so retraining works.
- **Tests** — new suites: `voiceSession.test.ts` (FSM transitions, barge-in, error auto-reset, partial transcripts), `cloudSync.test.ts` (push/pull/conflict/error/jwt fallback), `adaptiveEngine.competency.test.ts` (training thresholds + nudge sign), and an extra `weeklyReportData` case for the 12-row competency rollup.
- **Type cleanup** — fixed prop signatures for `CompetencyBadges` and `CompetencyDetailModal` callers in `BrainMapScreen`, `GeneratorScreen`, and `ActivityDetailScreen`; tightened `Activity → imageUrl` cast in `OfflinePackButton`.
- **Docs** — `memory-bank/progress.md` updated; `docs/FUTURE_ROADMAP.md` §1.0 now contains an implementation snapshot table.

## Pre-existing comprehensive audit (kept for continuity)

### Completed in comprehensive audit pass
- **Server security** (`supabase/functions/server/index.tsx`): added `requireUser` JWT gate, per-user rate limits, input validation + sanitization, timing-safe HMAC comparison for Razorpay, removed leaky error strings.
- **DB / client security**: new `00008_feed_moderator_policies.sql` RLS migration; fixed `communityScorer` to call `functionsBaseUrl` with bearer JWT; added `src/utils/fileValidation.ts` (size + MIME guards) and wired into `CaptureButton`, `PortfolioScreen`, `ProfileScreen`; wrapped `textScale` `localStorage` access in safe try/catch helpers.
- **Context bug fixes**: collapsed `AppContext.logActivity` into a single `setP` updater to kill a stale-closure on `adaptiveModel`; moved `setView` calls out of `setP` in `syncFromSession`/`loginUser`; `FeedContext` now falls back to last-good cache on remote fetch failure instead of wiping posts.
- **Brain map rework**: new `BrainSvgOverlay.tsx` (focusable, keyboard-navigable, aria-labeled SVG paths), `BrainLegend.tsx` (color swatch + intelligence key + % coverage per region), updated `BrainTooltip.tsx` to show intelligence key, refactored `BrainCanvas.tsx` to own only rendering/pan/zoom while the overlay handles hit testing.
- **Per-screen error isolation**: new `ScreenErrorBoundary.tsx` that does NOT nuke localStorage; `App.tsx` now renders a fresh boundary keyed by `view` and wires "Try again" to `goBack`/`navigate("home")`.
- **Monitoring**: extended `reportClientError` to attach a `screen` tag.
- **Tests**: added `fileValidation.test.ts`, `communityScorer.test.ts`, `BrainSvgOverlay.test.tsx`, `BrainLegend.test.tsx`.

## Verification
- TypeScript: 0 errors
- ESLint: 0 errors, 0 warnings
- Tests: 95 passing (24 files)
- All brain-map interactions are now keyboard accessible.

## Pre-existing state (kept for continuity)

## Completed in this session
- Implemented 8 remaining modules (11–18) from the Ultra Features Blueprint
- Created all engine/lib files, UI components, and screen routes
- Added 20 new locale files (31 total = English + 30 translations)
- Created 3 new SQL migrations (portfolio, caregivers, narrative_cache)
- Added 3 new edge function endpoints (narrative/generate, ml/aggregate, report/email)
- Extended AppContext with 8 new persisted state fields and 8 new methods
- Wired all new screens into App.tsx router and viewConfig
- Updated ProfileScreen and HomeScreen with new feature navigation
- Fixed all TypeScript errors and lint warnings
- Built both debug and release APKs via Capacitor + Gradle

## Verification
- TypeScript: 0 errors
- ESLint: 0 errors, 0 warnings
- Tests: 81 passing
- Build: Succeeds
- Capacitor Sync: Succeeds
- APK Build: Both debug and release APKs generated

## APK Locations
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk` (6.3 MB)
- Release: `android/app/build/outputs/apk/release/app-release-unsigned.apk` (5.3 MB)

## Next steps for deployment
1. Sign release APK with production keystore
2. Push Supabase migrations to production
3. Configure production API keys
4. Deploy edge functions
5. Submit to Play Store

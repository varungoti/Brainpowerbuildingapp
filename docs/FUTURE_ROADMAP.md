# Brain Power — Future Roadmap, AI-Age Readiness & Conversational Voice Plan

> **Audience:** internal product + engineering. This document is **not** linked
> from the consumer app. The "Innovation Lab" panel that previously surfaced
> roadmap items in `ProfileScreen` is now gated behind the admin allowlist
> (`canAccessBlueprint(user)`), so public users no longer see unshipped
> promises.

Three parts:

0. **AI-Age Readiness Framework** — the evidence-grounded redesign of the
   recommendation core that prepares children (0–12) for an AI-saturated
   future. Foundational dimensions are already shipped; UI + content
   expansion roadmap below.
1. **Roadmap status & next-wave initiatives** — what's actually shipped vs.
   what's still on the runway.
2. **Conversational Voice Plan** — detailed plan for native-mobile voice
   (TTS + STT + wake-word + barge-in + agent loop), the single biggest
   experience upgrade we're considering next.

---

## Part 0 — AI-Age Readiness Framework (NEW)

### 0.1 Why this exists

LLMs and autonomous agents are about to make many traditional cognitive tasks
cheap, while making a small set of human capabilities dramatically more
valuable: judgement, taste, long-horizon planning, source evaluation, ethical
reasoning, and embodied skill. WEF's *Future of Jobs 2025*, OECD's *Learning
Compass 2030*, UNESCO's *AI Competency Framework for Students (2024)*, and
recent AI-economics work (Acemoglu 2024, Brynjolfsson et al. 2023) all
converge on the same shortlist. At the same time, the developmental-science
evidence is clear about what *actually* moves children's cognition (Diamond
& Ling 2016 on EF; EEF on metacognition; Skene et al. 2022 on guided play;
Stanford SHEG on lateral reading) — and what doesn't (Lumosity-style
brain-training transfer, generic growth-mindset interventions, learning
styles, universal mindfulness for adolescents).

This framework operationalises that intersection into 12 dimensions the app
can score and develop over time. We *layer it on top of* the existing
15-region brain model — the brain-region UI, scoring, and tagging stay
intact for back-compat. Competency scoring is a parallel vector
(`ChildProfile.competencyScores`) and a parallel recommendation hook
(`AGEGeneratorOptions.priorityCompetencies`).

### 0.2 The 12 Competencies

| # | ID | Competency | Why AI-age |
|---|-----|------------|------------|
| 1 | `executive-function` | Executive Function (WM, inhibition, flexibility) | When AI removes external structure, internal self-direction is the floor |
| 2 | `metacognitive-self-direction` | Metacognitive Self-Direction | Judging whether an answer (yours or AI's) is actually good |
| 3 | `long-horizon-agency` | Long-Horizon Project Agency | LLMs systematically fail at multi-day planning (HeroBench 2025) |
| 4 | `embodied-mastery` | Embodied Mastery | AI has no body; embodied skill is durable + causally develops EF |
| 5 | `deep-knowledge-retrieval` | Deep Knowledge & Retrieval | Can't evaluate AI output competently without genuine subject understanding |
| 6 | `guided-curiosity` | Guided-Play Curiosity | Top-8 WEF skill; guided play beats both rote + free play |
| 7 | `ai-literacy-cocreation` | AI Literacy & Co-Creation | UNESCO frame: ethical co-creators, not passive users |
| 8 | `lateral-source-evaluation` | Lateral Source Evaluation | The new floor of literacy when misinformation is zero-cost |
| 9 | `creative-generation` | Creative Generation (divergent + convergent) | AI accelerates generation; humans monetise taste + selection |
| 10 | `social-attunement` | Social Attunement | Empathy/listening/leadership all in WEF top-10 |
| 11 | `emotional-resilience` | Emotional Resilience & AI Hygiene | EFs collapse under stress; AI-companion over-reliance is an emerging risk |
| 12 | `ethical-judgment` | Ethical Judgment Under Uncertainty | OECD Compass: "Reconciling tensions and dilemmas" |

Full definitions, age notes, and citations live in
`src/lib/competencies/aiAgeCompetencies.ts`. Each dimension carries inline
evidence so we can never claim something the literature won't support.

### 0.3 What we explicitly do NOT do (anti-patterns we're avoiding)

The research review surfaced several common ed-tech failure modes. We
codify their absence as part of the framework:

1. **No "brain-training games" with transfer claims.** Melby-Lervåg & Hulme
   meta-analyses (2013, 2016): no transfer beyond trained tasks. Lumosity
   paid the FTC $2M for exactly this.
2. **No generic growth-mindset layer.** Macnamara & Burgoyne 2022:
   post-correction effect ~d=0.05. Reserve for kids actively struggling.
3. **No Multiple Intelligences or learning styles framing in marketing.**
   Both are neuromyths (Frontiers 2023; Pashler 2008). We use plural
   on-ramps for inclusion, not as a scientific claim.
4. **No universal mindfulness pushes for kids.** MYRIAD trial (Kuyken
   2022): null and possibly harmful for already-symptomatic adolescents.
5. **No anthropomorphic AI "friends" for children.** Emerging 2025
   evidence on adolescent attachment to AI companions shows
   behavioural-addiction patterns; our voice plan explicitly forbids
   "AI is your friend" framing.
6. **No strict screen-minute limits.** AAP has explicitly moved to the
   *5 Cs* framework (content, co-use, calm, crowding-out, communication).
7. **No "neuroscience-based" claims unless we cite a specific study.**

### 0.4 What's already shipped (this PR / today)

```
src/lib/competencies/aiAgeCompetencies.ts        ← framework + scoring helpers
src/lib/competencies/aiAgeCompetencies.test.ts   ← 19 unit tests
src/app/data/activities.ts
  ├─ Activity.competencyTags?: AIAgeCompetencyId[]
  ├─ enrichActivity → inferCompetencyTags fallback
  ├─ AGEGeneratorOptions.priorityCompetencies
  └─ runAGE scoring loop (+12 per matched competency)
src/app/context/AppContext.tsx
  ├─ ChildProfile.competencyScores?: Record<string, number>
  ├─ addChild → defaults competencyScores to {}
  └─ logActivity → applyCompetencyDeltas weighted by engagement
src/app/screens/GeneratorScreen.tsx
  └─ runAGE call now passes pickPriorityCompetencies(child, 2)
src/app/data/activities.ts (catalogue)
  └─ Five new seed activities (a71–a75) for under-served dimensions:
     a71 Three-Day Maker Mission        → long-horizon-agency
     a72 Plan-Do-Review Daily Loop      → metacognitive-self-direction
     a73 What Should the Robot Do?      → ethical-judgment
     a74 Co-Write a Story with AI Helper → ai-literacy-cocreation (deep)
     a75 Three-Source Truth Check        → lateral-source-evaluation
```

All 70 legacy activities are auto-tagged via the heuristic so the
recommendation engine starts working immediately for existing users.
Author overrides on new activities always win.

### 0.5 What's NOT yet shipped — UI surface + content roadmap

The engine works today, but the parent doesn't see competency scores
anywhere. That UI work is the next phase. Sequenced for impact:

#### Phase A — Make competencies visible (1 week)

1. **CompetencyRadar component** (`src/components/competency/CompetencyRadar.tsx`)
   - 12-spoke radar chart, one per dimension.
   - Mounts in `BrainMapScreen` as a new tab next to "Insights".
   - Color-codes weakest 2 (gold ring) and strongest 2 (teal ring).
2. **"Today's focus" chip** on `HomeScreen`
   - Shows the child's two priority competencies and a one-sentence why.
   - Tapping opens an explainer + a single recommended activity for each.
3. **Per-activity "develops" badges** in pack and detail screens
   - Render the `competencyTags` as small chips with the competency emoji.
   - Click → modal with definition + research citation.

**Acceptance.** Parent can answer "what is this app developing in my kid?"
in <10 seconds with concrete, evidence-cited dimensions.

#### Phase B — Weekly Intelligence Report rebuild (1 week)

Today's PDF lists 15 brain-region coverage. Add a **second page**:

- 12-dim radar over the last 7 days
- Top 3 dimensions developed this week (with the activities that did it)
- Bottom 3 (with one suggested activity each)
- One-paragraph plain-English narrative ("Aanya focused on creative
  generation and social attunement this week. To stay AI-ready, the
  next nudge is long-horizon agency — try the Three-Day Maker Mission.")

#### Phase C — Content expansion (3 weeks)

The audit + heuristic shows current under-coverage:

| Competency | Current activity count | Target |
|------------|------------------------|--------|
| long-horizon-agency | 1 (a71) | 6 — multi-day projects per age tier |
| ethical-judgment | 1 (a73) | 5 — dilemma stories per age tier |
| lateral-source-evaluation | 2 (a52, a75) | 6 — verification habits |
| metacognitive-self-direction | 1 (a72) | 6 — think-aloud + plan-do-review |
| ai-literacy-cocreation (deep) | 1 (a74) | 5 — supervised co-creation projects |

That's ~25 new authored activities. Each must cite a specific study and
be reviewed by an early-childhood educator before merge.

#### Phase D — Adaptive engine v2 (2 weeks)

Right now the adaptive ML layer (`src/lib/ml/adaptiveEngine.ts`) keys on
*cultural region* (`Activity.region`). Refactor to also produce
**per-competency weights** so the priority-competency boost in `runAGE`
gets sharper over time:

```typescript
interface AdaptiveModel {
  // existing
  regionWeights: Record<string, number>;
  recommendations: Record<string, AdaptiveRegionRecommendation>;
  // new
  competencyWeights?: Partial<Record<AIAgeCompetencyId, number>>;
  competencyConfidence?: Partial<Record<AIAgeCompetencyId, number>>;
}
```

Train on engagement-rated logs grouped by `competencyTags`. Surface in
`runAGE` as an additional bonus (`(weight − 1) × 12`). Honest fallback
when sample size is low — never let a single weak session over-suppress
a dimension.

#### Phase E — Parent coaching mode upgrade (2 weeks)

Per-activity coaching tips already exist (`Activity.parentCoaching`).
For the 25 new AI-age activities, add a **"Why this matters in the AI
age"** field — one short, citation-grounded paragraph the parent reads
*before* the activity, so the parent understands the strategic intent
and naturally reinforces it during play.

#### Phase F — Family AI-Hygiene playbook (1 week)

A small in-app artefact (3-screen tour, surfaced once during onboarding
and again at the 30-day mark):

- Visible mic = listening; we never store audio by default
- AI is a tool, not a friend (zero anthropomorphism in our copy)
- The Two-Question Rule (Activity a29) as a household norm
- Quiet hours + no AI in the bedroom guidance

### 0.6 Telemetry & success metrics for AI-Age Readiness

| Metric | Target |
|--------|--------|
| % of weekly active children with ≥3 competency dimensions activated | 70% |
| Median weakest-competency growth per month (score points) | +1.5 |
| % of generated packs containing ≥1 activity tagged with the priority competency | 80% |
| Engagement rating averaged across AI-age seed activities (a71–a75) | ≥3.8 / 5 |
| Parent comprehension on a 4-question quiz: "what does this app develop?" | ≥75% correct |

Implement via the existing `captureProductEvent` channel + a new
`competency_priority_set` event each time the recommender selects priority
competencies, with the dimension IDs in the payload.

### 0.7 Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Over-claiming "neuroscience-based" | Every competency has its citations baked into the source of truth; the UI surfaces them on tap. |
| Parents perceive 12 dimensions as overwhelming | Phase A surfaces only **two** priority competencies at a time; the full radar is a tab, not the home page. |
| Heuristic mis-tags legacy activities | Author overrides win; we'll review the inferred tags during Phase C content expansion and override as needed. |
| Premature optimisation of weakest dimensions creates monotony | `runAGE` boost is +12 (vs +14 for `priorityIntelligences`) — a nudge, not a hammer. Pack diversity rules still enforce intelligence spread. |
| Copy slippage into "growth mindset" / "MI" framing | Roadmap explicitly forbids; copy review by a clinical advisor before any new marketing. |

### 0.8 Definition of done for AI-Age Readiness v1

- ✅ Engine ships: 12 dimensions, scoring, recommendation hook, 5 seed
  activities, unit tests, suite green.
- ✅ Phase A UI: `CompetencyRadar` tab on `BrainMapScreen`, Today's Focus
  chip on Home, per-activity "develops" badges on detail screen.
- ✅ Phase B PDF: 12-dim section in Weekly Intelligence Report
  (`weeklyReportData.ts`).
- ✅ Phase C content: **24 authored AI-age activities** (a71–a94) covering
  all five under-served dimensions with target counts met:
  long-horizon-agency 6, ethical-judgment 7, lateral-source-evaluation
  5 (+ legacy a52), metacognitive-self-direction 13,
  ai-literacy-cocreation **5 deep co-creation projects** (a74, a91–a94).
- ✅ Phase D adaptive: `competencyWeights` + `competencyConfidence` in
  `adaptiveEngine.ts`; `runAGE` applies a (weight − 1) × 12 nudge.
- ✅ Phase E parent coaching: every AI-age activity (a71–a94) carries a
  `whyAIAge` paragraph; surfaced as a dedicated card in
  `ActivityDetailScreen`.
- ✅ Phase F AI-hygiene playbook: `AIHygieneTour` shown once during
  onboarding and again at the 30-day mark.

**Status (this pass):** 202/202 unit tests green; `tsc --noEmit` clean.
The "v1" of AI-Age Readiness is fully shipped end-to-end. Remaining
roadmap effort moves to Part 1 / Part 2 surfaces.

---

## Part 1 — Roadmap Status

### 1.0 Implementation snapshot (latest pass)

> Updated after the gap-fix pass that closed the audit findings against
> §1.2 (cloud sync auto-push, premium server-check, magic-link invite,
> ConversationButton mounts, Phase C content, Phase E "Why this matters in
> the AI age") **plus the §0.8 Phase C closure pass that authored a91–a94
> to bring `ai-literacy-cocreation` to its target of 5 supervised
> co-creation projects**. 202/202 unit tests green; `tsc --noEmit` clean.

#### Gap-fix pass (this iteration)

| Audit gap | Fix | Where |
|---|---|---|
| Cloud sync was only manual ("Sync now" button); state changes did not auto-push | Added debounced auto-push effect in `AppContext` driven by `pushStateDebounced` whenever the persisted state mutates AND opt-in is on AND a Supabase JWT is available | `src/app/context/AppContext.tsx` |
| Magic-link `/invite?token=…` had no client route handler | Added URL parser in `App.tsx` that stashes the token in `sessionStorage` and dispatches a `neurospark:open-caregivers` event; `CaregiversScreen` consumes the pending token on mount and calls `acceptCaregiverInvite` automatically | `src/app/App.tsx`, `src/app/screens/CaregiversScreen.tsx` |
| `ConversationButton` was built but mounted nowhere | Mounted in `AICounselorScreen` (dictate-into-textarea) and `CoachChat` (talk-to-coach) | `src/app/screens/AICounselorScreen.tsx`, `src/components/coach/CoachChat.tsx` |
| `/voice/turn` SSE Edge Function had no client driver | New `speakViaVoiceTurnEdge` SSE client + 3 unit tests | `src/lib/voice/voiceTurnClient.ts`, `voiceTurnClient.test.ts` |
| `/billing/entitlement` was implemented but never read by client gates | New `useEntitlement` hook (refresh on mount + auth-change + visibility); wired into `BrainPanel` so server-side entitlement now drives premium without removing the local credit fallback | `src/lib/subscription/useEntitlement.ts`, `src/components/brain/BrainPanel.tsx` |
| Native local-notifications had no Capacitor bridge — only web `Notification` API | Added Capacitor `LocalNotifications` runtime-discovered plugin path inside `notificationChannel.ts`; both `sendLocalNotification` and a new `scheduleLocalNotificationAt` route to native when bridged, web fallback otherwise; 4 unit tests | `src/lib/notifications/notificationChannel.ts`, `notificationChannel.test.ts` |
| Phase C content under-covered: only 5 AI-age activities | Authored 15 new evidence-grounded activities (a76–a90) covering long-horizon-agency, ethical-judgment, lateral-source-evaluation, and metacognitive self-direction | `src/app/data/activities.ts` |
| Phase E "Why this matters in the AI age" field had no schema or UI | Added `whyAIAge?: string` to the `Activity` interface, backfilled all 5 seed activities + all 15 new ones, and surfaced the paragraph as a dedicated card on the Activity Detail screen | `src/app/data/activities.ts`, `src/app/screens/ActivityDetailScreen.tsx` |
| `ai-literacy-cocreation (deep)` was 1/5 of its §0.5 target — only `a74` was a true supervised co-creation project; a73/a75/a86 only touched the topic | Authored 4 genuine end-to-end co-creation rituals (`a91` Birthday Card, `a92` Lego from AI Plan, `a93` 30s Song, `a94` Real Outing). Each ends with a child-owned artefact and an explicit "where did the AI miss what we meant?" debrief. All carry `whyAIAge` and citations. | `src/app/data/activities.ts` |
| `/sync/state` was KV-only despite `00009_sync_state.sql` shipping — no Postgres path, no per-row queryability, KV-region failure = data loss | Migrated `postSyncState`/`getSyncState` to Postgres-first via `user_sync_state` with optimistic versioning preserved; KV survives as a one-time read fallback (lazy-hydrates Postgres on next pull) AND as a write-side fallback when Postgres is unreachable. Wire contract unchanged so `cloudSync.ts` + tests are untouched. | `supabase/functions/server/index.tsx` |
| Voice adapter only knew about the in-house `NeuroSparkVoice` plugin (not yet built); the community plugins recommended by §2.4 (`@capacitor-community/text-to-speech`, `@capacitor-community/speech-recognition`) would be silently ignored even when installed | New `CommunityPluginAdapter` composes whichever community plugins are present with `WebVoiceAdapter` for missing primitives. `pickAdapter()` now: NeuroSparkVoice → community → web. TTS path maps `text/locale/rate/pitch` straight through; STT path runs the `available()`/`checkPermissions()`/`requestPermissions()`/`addListener("partialResults")` dance + final transcript. 9 jsdom unit tests. | `src/lib/voice/nativeVoiceAdapter.ts`, `src/lib/voice/nativeVoiceAdapter.test.ts` |
| `BrainTooltip` percent pill hard-coded slate-900 text on `region.color` — fails WCAG AA on the `#7A69E8` indigo (4.26:1 vs 4.5 required). `BrainLegend` percent pill drew the region color on a 13%-alpha tint of itself — fails AA badly for every light pastel (e.g. `#D9DD67`, `#94E55C`) | New `src/lib/brain/contrast.ts` with WCAG 2.1 primitives + `getAccessiblePillStyle(bg)` that auto-darkens/lightens the background until AA is met. `BrainTooltip` adopts the helper; `BrainLegend` switches to fixed slate-700 on the tint (verified to pass AA for all 15 region colors). 52 contrast unit tests including a parametric per-region pass that catches palette regressions. | `src/lib/brain/contrast.ts`, `src/lib/brain/contrast.test.ts`, `src/components/brain/BrainTooltip.tsx`, `src/components/brain/BrainLegend.tsx` |
| Auth/onboarding/first-activity funnel had zero telemetry — we couldn't measure where new accounts dropped off, and Sentry init was always-on with no remote off-switch | New funnel events `auth_view/submit_attempt/success/fail`, `onboard_step_view/complete`, `activity_open`, `first_activity_open/complete` plus `is_first_activity` flag on `activity_complete`. `pRef.current.activityLogs` is checked BEFORE the new entry is committed so the first-activity flag is unambiguous. Supabase auth error strings are bucketed via `classifySupabaseAuthError` so PostHog never sees emails/IPs. Zero-dep PostHog HTTP forwarder posts to `{host}/i/v0/e/` with anon `crypto.randomUUID()` distinct_id persisted to localStorage. Sentry init now respects a `monitoring_kill` feature flag for emergency throttling. 16 new vitests covering all of it. | `src/utils/productAnalytics.ts`, `src/utils/posthogForwarder.ts`, `src/utils/posthogForwarder.test.ts`, `src/utils/monitoring.ts`, `src/utils/monitoring.test.ts`, `src/app/screens/AuthScreen.tsx`, `src/app/screens/OnboardingScreen.tsx`, `src/app/screens/ActivityDetailScreen.tsx`, `src/app/context/AppContext.tsx`, `src/vite-env.d.ts` |
| Funnel telemetry shipped but had no end-to-end assertion — a refactor that silently dropped one of the events would never be caught by unit tests | New Playwright spec drives a real production build through the entire signup → onboarding → first-activity-complete loop and asserts the captured event stream (presence, order, uniqueness, key props like `dwell_ms`/`is_first_activity`). To make the assertions possible without a network sink, `captureProductEvent` dispatches every payload on a `neurospark:product_event` `CustomEvent`; the spec subscribes via `page.exposeFunction` + `addInitScript`. Build path uses the existing `VITE_E2E_SUPPRESS_SB_CLIENT` escape hatch so the spec is deterministic on developer machines with real Supabase configured. | `tests/e2e/auth-onboarding-first-activity.spec.ts`, `src/utils/productAnalytics.ts` |

| Section | Item | Status | Where it lives |
|---|---|---|---|
| Part 0 / Phase A | CompetencyRadar tab, badges, focus chip | ✅ shipped | `src/components/competency/*`, `BrainMapScreen` AI-Age tab, Home, Generator, Activity Detail |
| Part 0 / Phase B | 12-dim section in Weekly Intelligence Report | ✅ shipped | `src/lib/reports/weeklyReportData.ts` + `ReportScreen` |
| Part 0 / Phase D | `competencyWeights` in adaptive engine + scoring nudge | ✅ shipped | `src/lib/ml/adaptiveEngine.ts`, `src/app/data/activities.ts` |
| Part 0 / Phase F | Family AI-Hygiene tour (1st activity + 30-day refresher) | ✅ shipped | `src/components/onboarding/AIHygieneTour.tsx` |
| 1.2 A | Cloud sync (`/sync/state`, opt-in toggle, migration) | ✅ shipped | `src/lib/sync/cloudSync.ts`, `CloudSyncCard`, `00009_sync_state.sql`, Edge Function |
| 1.2 B | Caregiver invite + accept (scoped) | ✅ shipped | `src/lib/caregiver/caregiverApi.ts`, `CaregiversScreen` cloud invite section, Edge Function |
| 1.2 C | Notifications settings card + permission flow | ✅ shipped | `src/components/notifications/NotificationSettingsCard.tsx` |
| 1.2 D | Streaks + Quest board surfaced | ✅ shipped | `HomeScreen` quest section, `QuestBoard` |
| 1.2 E | Milestone predictor + Weekly Narrative on Brain Map | ✅ shipped | `BrainMapScreen` "Brain" tab |
| 1.2 F | Offline pack — "Download this week" + SW prefetch | ✅ shipped | `OfflinePackButton`, `public/sw.js` `PREFETCH_PACK_ASSETS` |
| 1.2 G | `/billing/entitlement` + restore-purchases shim | ✅ shipped (web shim) | `src/lib/subscription/entitlement.ts`, Edge Function |
| 1.2 H / Part 2 | Conversational voice — adapter + FSM + UI + Edge | ✅ shipped (web fallback live, native plugin stubbed) | `src/lib/voice/*`, `ConversationButton`, `VoiceSettingsCard`, `/voice/turn` SSE |
| 1.2 I | Telemetry batched sink with `sendBeacon` | ✅ shipped | `src/utils/productAnalytics.ts` |

Open follow-ups (not blocking 110% production-ready):
- In-house full-stack `NeuroSparkVoice` Capacitor plugin — adapter still picks it first when present. Community-plugin path below covers most of the gap until then.
- ✅ **Community voice plugins now wire end-to-end (Apr 2026, night +3, +follow-up #2).** `pickAdapter()` now also detects `@capacitor-community/text-to-speech` and `@capacitor-community/speech-recognition` on `window.Capacitor.Plugins`, composes them with `WebVoiceAdapter` for whichever side is missing, and maps the plugin APIs onto the existing `VoiceAdapter` contract (TTS rate/pitch/locale, STT permission flow + partial-results listener + final transcript). Priority order is now: NeuroSparkVoice (full-stack) → community plugins (partial) → web. 9 new vitests in `nativeVoiceAdapter.test.ts` cover all branches; suite is 211/211.
- Picovoice Porcupine wake-word integration (Part 2 §2.4).
- Native IAP via `@capacitor-community/in-app-purchases-2` once a sandbox account is provisioned.
- ~~Migrate `user_sync_state` blob from Edge KV to the Postgres table created in `00009_sync_state.sql`~~ ✅ **Shipped (Apr 2026, night +3).** `postSyncState` / `getSyncState` now write/read `public.user_sync_state` first; KV is consulted only as a one-time fallback so devices last synced under the KV-only path don't lose their blob (lazy-hydrated on next pull). Wire contract unchanged → `cloudSync.ts` + its 8 tests untouched. KV write still fires when Postgres is unreachable (single-region availability fallback). 202/202 vitest green.

### 1.1 The 10 "Innovation Lab" ideas — STATUS: shipped

All ten items the Profile screen previously listed as "Planned / Coming
soon" actually ship in the app today. The Innovation Lab section was stale
marketing copy. Current status, with the file/screen that owns each:

| # | Idea | Status | Where it lives |
|---|------|--------|----------------|
| 1 | AI Activity Adaptation | shipped | `src/lib/ml/`, `supabase/functions/server` `/ml/aggregate` |
| 2 | Weekly Intelligence Report (PDF) | shipped | `weekly_report` screen, `@react-pdf/renderer` |
| 3 | Sibling Collaboration Mode | shipped | `sibling_mode` screen |
| 4 | Voice Instruction Mode (TTS) | shipped (basic) | `src/lib/voice/voiceNarrator.ts`, `VoicePlayerBar` |
| 5 | 10-Language Support | shipped (20+ locales) | `src/locale/*.json` |
| 6 | Creation Portfolio | shipped | `portfolio` screen, `CaptureButton` |
| 7 | Parent Coaching Mode | shipped | `src/lib/coaching/`, `CoachChat` |
| 8 | Seasonal Activity Library | shipped | `seasonal_library` screen |
| 9 | Sensory Modification Engine | shipped | `settings_sensory` screen |
| 10 | Community Activity Ratings | shipped | `src/lib/community/communityScorer.ts`, `/rate-activity` Edge Function |

**Action:** keep the Innovation Lab panel admin-only (already done in this
patch). Marketing copy on the public side should describe *capabilities*, not
"coming soon" badges.

### 1.2 What's actually still on the runway

These are the genuinely unfinished items pulled from `memory-bank/`,
`ULTRA_FEATURES_BLUEPRINT.md`, in-code comments, and known gaps. Each is
sized roughly so they can be sequenced into a real backlog.

#### A. Cloud sync (cross-device profile + history) — Size: M

- **Problem.** Profile/backup is local-file only today. Comment in
  `ProfileScreen.tsx:105`: *"Backup / new device (local file — cloud sync
  still planned)"*. Switching devices loses everything.
- **Plan.**
  1. Reuse `supabase/migrations/00007_narrative_cache.sql` pattern: add
     `app_state_snapshots(user_id PK, payload jsonb, version, updated_at)`
     with RLS `auth.uid() = user_id`.
  2. New Edge Function `/sync/state` with `GET` (latest snapshot) and `PUT`
     (debounced, last-writer-wins with version check).
  3. Client: in `AppContext` debounce serialize-to-cloud every 30s when
     `isSupabaseConfigured() && session`. Conflict resolver merges
     `feedPosts`, `portfolio`, `routine` arrays by `id`.
  4. UI: Profile gets a "Cloud sync" toggle + last-synced timestamp.
- **Risks.** Quota — payload should stay <200 KB; strip `adaptiveModel`
  history older than 60 days before upload. Privacy — explicit opt-in,
  payload encrypted at rest by Supabase.
- **Acceptance.** Sign in on a second device → portfolio/feed/routine appear
  within 10s. Offline edits reconcile on reconnect.

#### B. Caregiver invite flow + permission model — Size: M

- **Status.** UI shell exists (`CaregiversScreen.tsx`,
  `00006_caregivers.sql`), but invite tokens, accept-link, and per-caregiver
  scope (read-only / co-parent / educator) are not wired end-to-end.
- **Plan.**
  1. `caregiver_invites(token PK, owner_user_id, scope, email, expires_at,
     accepted_at)`; insert via Edge Function `/caregivers/invite` (auth
     required).
  2. Magic link `https://app/invite?token=…` opens an "Accept invitation"
     screen → calls `/caregivers/accept`, writes a row to `caregivers`.
  3. Read scope filters which screens the caregiver sees (no payments, no
     PII edit) using an existing `useCaregiverScope()` hook.
- **Acceptance.** Owner sends invite → caregiver opens link, accepts, sees
  child profile + history but cannot edit billing or delete data.

#### C. Notifications & smart reminders — Size: M

- **Status.** `src/lib/notifications/{smartScheduler,notificationChannel}.ts`
  scaffold exists; Capacitor local-notifications plugin not integrated;
  push not wired.
- **Plan.**
  1. Add `@capacitor/local-notifications`. On Android, request
     `POST_NOTIFICATIONS` (API 33+) and exact-alarm permission.
  2. Daily 7-PM "today's activity" + weekly Sunday "report ready" reminders,
     scheduled by `smartScheduler` based on past completion times.
  3. Optional Push: FCM via `@capacitor-firebase/messaging`, gated behind
     remote `enable_push` flag in `/remote-config`.
  4. Quiet hours (22:00–07:00 local) honored everywhere.
- **Acceptance.** Reminder fires at the user's median completion hour ±30
  min; mute toggle in Profile turns it off within one tick.

#### D. Gamified streaks + quest board — Size: S–M

- **Status.** `src/lib/gamification/{questEngine,streakSystem}.ts` and
  `QuestsScreen.tsx`/`QuestBoard.tsx` exist but are not yet linked from
  HomeScreen primary nav; no badge persistence in `AppContext`.
- **Plan.** Persist `streak`, `longestStreak`, `unlockedBadges[]` in
  `AppPersistedState`; surface a small streak chip on Home; weekly
  `quests` get generated by `questEngine` from the child's weakest 3
  intelligences.
- **Acceptance.** Completing an activity 3 days in a row shows a 3-day
  streak chip + "Bronze consistency" badge; resets gracefully if a day is
  missed.

#### E. Milestone predictor + bonding analytics — Size: M

- **Status.** Modules `milestonePredictor.ts`, `bondingAnalytics.ts`,
  `PredictorCard.tsx`, `WeeklyNarrative.tsx` exist but are not surfaced.
- **Plan.** Wire `PredictorCard` into `BrainMapScreen` "insights" tab;
  generate weekly narrative on Sunday using the existing
  `/narrative/generate` Edge Function and cache via
  `00007_narrative_cache.sql`.

#### F. Offline activity packs — Size: S

- **Status.** `src/lib/offline/offlinePackManager.ts` exists; UI to download
  a "this week" pack does not.
- **Plan.** Add a "Download this week" button on Home that pre-caches the
  next 7 activities (text + images) into IndexedDB so the app works fully
  offline for the school run.

#### G. Premium / subscription productionization — Size: M

- **Status.** `src/lib/subscription/premiumCheck.ts` + Razorpay scaffolding
  in `supabase/functions/server`; missing receipt validation, restore-
  purchases for iOS/Play, and a hardened entitlement check.
- **Plan.**
  1. Server-side: `subscriptions(user_id, status, plan, current_period_end,
     provider, provider_ref)`; `/billing/webhook` validates Razorpay
     signature (already timing-safe), updates row.
  2. Client checks entitlement via `/billing/entitlement` rather than a
     local boolean.
  3. Add Play Billing & App Store IAP via `@capacitor-community/in-app-
     purchases-2` for stores that mandate native IAP.
- **Acceptance.** Premium gates respect server entitlement; subscription
  cancellation revokes within 1 minute; restoring purchase on a fresh
  install works.

#### H. Conversational voice mode (NEW) — Size: L

See **Part 2** below for the full plan.

#### I. Cross-cutting hardening (always-on) — Size: ongoing

- ~~Per-screen telemetry (already have `reportClientError(_, { screen })`).~~
  ✅ **Shipped (Apr 2026, night +3, +follow-up #4).** New funnel events
  `auth_view`, `auth_submit_attempt`, `auth_submit_success`,
  `auth_submit_fail` (with bucketed `fail_reason` like `invalid_credentials`,
  `email_confirmation_pending`, `rate_limited`, …), `onboard_step_view`
  (per `welcome|child|materials|ready` step), `onboard_complete`,
  `activity_open`, `first_activity_open`, `first_activity_complete`, plus
  an `is_first_activity` boolean on `activity_complete`. Wired into
  `AuthScreen`, `OnboardingScreen`, `ActivityDetailScreen`, and
  `AppContext.logActivity`. The "first activity" branch is computed from
  `pRef.current.activityLogs` BEFORE the new entry is committed so
  `is_first_activity` is unambiguous. Telemetry is privacy-light:
  Supabase auth error strings are bucketed via
  `classifySupabaseAuthError` so we never leak emails / IPs / raw
  messages into PostHog.
- ~~Sentry/PostHog wiring behind a remote-config flag.~~
  ✅ **Shipped (Apr 2026, night +3, +follow-up #4).** Existing Sentry
  init now respects a `monitoring_kill` feature flag — set
  `VITE_FEATURE_FLAGS=monitoring_kill` to disable Sentry without
  redeploying app code (e.g. for an emergency throttle). New
  `src/utils/posthogForwarder.ts` adds a zero-dependency PostHog HTTP
  forwarder that piggybacks on the existing `captureProductEvent` batch
  flush. Activation requires all three: `import.meta.env.PROD`,
  `VITE_POSTHOG_KEY`, and the `posthog` flag in `VITE_FEATURE_FLAGS`.
  Anonymous `distinct_id` is generated via `crypto.randomUUID()` and
  persisted to `localStorage` so it survives reloads. No PII
  (no child names, emails, supabase uids) is forwarded — same contract
  as `productAnalytics.ts`. 16 new vitests cover env gating, host
  override, fetch-throws safety, distinct_id persistence, batch wire
  format, the `monitoring_kill` kill switch, and the new event taxonomy.
- ~~E2E coverage for the auth + onboarding + first-activity loop with
  Playwright running in CI.~~ ✅ **Shipped (Apr 2026, night +3,
  +follow-up #5).** New
  `tests/e2e/auth-onboarding-first-activity.spec.ts` walks the entire
  funnel against a real production build and asserts the captured event
  stream end-to-end: `auth_view` → `auth_submit_attempt` (with `dwell_ms`)
  → `auth_submit_success` → `onboard_step_view × 4` (welcome / child /
  materials / ready) → `onboard_complete` → `activity_open` (with
  `is_first_activity: true`) → `first_activity_open` →
  `activity_complete` (`is_first_activity: true`) →
  `first_activity_complete`. To make the spec observable without an HTTP
  sink, `captureProductEvent` now also dispatches the same payload on a
  `neurospark:product_event` `CustomEvent` (one allocation per event,
  zero-listener cost in production). The spec piggybacks on this bus
  via `page.exposeFunction` + `addInitScript`. Funnel ordering AND
  per-event uniqueness (`first_activity_open` and
  `first_activity_complete` each fire exactly once per signup) are both
  asserted. The build path uses the existing `VITE_E2E_SUPPRESS_SB_CLIENT`
  flag so the spec is deterministic against developer machines that
  have a real Supabase project provisioned (otherwise email-confirmation
  flow would block the funnel).
- ~~WCAG audit pass on color contrast in `BrainCanvas` legend and
  tooltips.~~ ✅ **Shipped (Apr 2026, night +3, +follow-up #3).** New
  `src/lib/brain/contrast.ts` exposes WCAG 2.1 primitives
  (`relativeLuminance`, `getContrastRatio`, `getReadableTextOn`,
  `compositeOver`) plus a higher-level `getAccessiblePillStyle(bg)` that
  returns a `{background, color}` pair guaranteed to meet AA — when
  neither slate-900 nor white passes on the original swatch (real case:
  the bodily region's `#7A69E8` indigo, white = 4.26:1, slate = 3.7:1)
  the helper darkens or lightens the background in 5% steps until ratio
  ≥ 4.5. `BrainTooltip` percent pill now uses this helper, and
  `BrainLegend` percent pill uses fixed `slate-700` (`#334155`) on the
  13% region tint, which passes AA against every region color (verified
  exhaustively). `src/lib/brain/contrast.test.ts` adds **52 unit tests**
  including a parametric per-region pass that will fail loudly if anyone
  adds a new region color or changes the legend/tooltip foregrounds.

### 1.3 Suggested sequencing (next 12 weeks)

The AI-Age Readiness UI rollout is now sequenced alongside the existing
infrastructure roadmap. Engine ships today (Part 0); UI follows.

| Week | Theme | Deliverables |
|------|-------|--------------|
| 1 | **AI-Age Readiness — Phase A** | CompetencyRadar tab, Today's Focus chip, per-activity badges |
| 2 | **AI-Age Readiness — Phase B** | Weekly Intelligence Report 12-dim page rebuild |
| 3 | Cloud sync foundation | Migration + `/sync/state` + opt-in toggle |
| 4 | Notifications | Capacitor local notifications + reminder scheduler |
| 5 | Caregiver invites | Tokenized invite + accept flow + scope guard |
| 6 | Conversational voice — Phase 1 (TTS-only upgrade) | Native TTS via Capacitor plugin, voice picker, locale-aware fallback |
| 7–8 | Conversational voice — Phase 2 (STT + barge-in) | Native STT plugin, push-to-talk, partial transcripts |
| 9 | Conversational voice — Phase 3 (agent loop) | Coach + Counselor talk-back, tool calls, safety filter |
| 10 | **AI-Age Readiness — Phase C/D** | Author 25 new activities + per-competency adaptive weights |
| 11 | **AI-Age Readiness — Phase E/F** | Parent coaching "Why AI-age" + Family AI-Hygiene playbook |
| 12 | Polish + launch readiness | Streaks/quests surface, milestone predictor surface, paid restore-purchases |

---

## Part 2 — Conversational Voice Plan

### 2.1 Why voice, why now

Parents using the app are usually mid-activity with their child — hands
busy, eyes on the kid, not the screen. Today the app uses TTS for activity
narration only (web `speechSynthesis` via `voiceNarrator.ts`). The full
conversational experience would let a parent say *"Coach, what's a calmer
version of this?"* and hear an answer back, all without looking at the
phone. This is the highest-leverage UX change available to us and it
aligns perfectly with the on-device, privacy-first ethos.

### 2.2 Capability target

| Capability | Today | Target |
|------------|-------|--------|
| TTS engine | Web Speech API only | Native iOS AVSpeechSynthesizer + Android TextToSpeech via Capacitor plugin, with web fallback |
| Voice quality | OS default | High-quality neural voice per locale (Samantha / Daniel on iOS, Wavenet/Network voices on Android) |
| STT | None | Native iOS SFSpeechRecognizer + Android SpeechRecognizer, offline where supported |
| Wake-word | None | Optional "Hey Coach" via on-device picovoice/porcupine (premium only) |
| Barge-in | None | User speaking interrupts ongoing TTS |
| Latency budget | n/a | <250 ms first-token TTS, <600 ms STT partial |
| Languages | 20+ in i18n strings | TTS: 12 confirmed; STT: en/hi/es/fr/pt/zh in Phase 2 |
| Privacy | n/a | Audio buffers never leave device by default; opt-in cloud STT for premium accuracy |

### 2.3 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ React UI                                                    │
│   ConversationButton  →  useVoiceSession()                  │
└────────────┬────────────────────────────────────────────────┘
             │
   ┌─────────▼──────────┐    ┌────────────────────┐
   │ VoiceSession (FSM) │◄───┤ AgentRouter         │
   │  idle→listen→think │    │  (Coach | Counselor │
   │  →speak→idle       │    │   | Narrator)       │
   └─────┬──────────┬───┘    └──────────┬─────────┘
         │          │                   │
   ┌─────▼───┐  ┌───▼─────┐    ┌────────▼────────┐
   │ STT     │  │ TTS     │    │ Edge Function   │
   │ adapter │  │ adapter │    │ /voice/turn     │
   └─────┬───┘  └───┬─────┘    └────────┬────────┘
         │          │                   │
   ┌─────▼──────────▼───┐    ┌──────────▼────────┐
   │ Capacitor plugins  │    │ OpenAI gpt-4o-mini│
   │ (native iOS/Android│    │  + safety filter  │
   │  + web fallback)   │    └───────────────────┘
   └────────────────────┘
```

Key design decisions:

- **One FSM, three adapters.** `VoiceSession` is the only place that owns
  state; STT/TTS/Agent are pluggable so we can ship the FSM with mocks and
  swap real adapters in.
- **Adapter pattern per platform.** `voiceAdapter.web.ts`,
  `voiceAdapter.ios.ts`, `voiceAdapter.android.ts` — Capacitor's
  `Capacitor.getPlatform()` selects at runtime.
- **No raw audio over the wire by default.** STT happens on-device;
  transcripts (text only) go to the Edge Function. Cloud STT is opt-in
  per-session for premium.

### 2.4 Capacitor plugins to evaluate

| Plugin | Role | Notes |
|--------|------|-------|
| `@capacitor-community/text-to-speech` | TTS | Mature, official-ish; supports rate/pitch/voice selection. |
| `@capacitor-community/speech-recognition` | STT | Wraps native APIs; partial results on iOS 13+/Android. |
| `@capacitor-community/native-audio` | Tone cues (start/stop chimes) | Tiny; avoids blocking on TTS. |
| `@picovoice/porcupine-react-native` (capacitor wrapper) | Wake-word | Phase 3, premium-only, license required. |
| `@capacitor/haptics` (already standard) | Haptic feedback at state transitions | Confirms taps in eyes-free mode. |

If a plugin we need isn't available, we wrap the native SDK in our own
Capacitor plugin (Swift + Kotlin) — both speech APIs are <300 lines per
platform.

### 2.5 Detailed phasing

#### Phase 1 — Native TTS upgrade (1 week)

1. Add plugin: `pnpm add @capacitor-community/text-to-speech` then
   `pnpm cap sync`.
2. New file `src/lib/voice/tts/ttsAdapter.ts` exporting `speak`, `stop`,
   `voicesForLocale`, `isAvailable`. Internally `if (Capacitor.isNativePlatform())`
   uses the plugin, otherwise delegates to existing
   `voiceNarrator.speak()`.
3. Refactor `voiceNarrator.ts` to call the adapter. Existing tests stay
   green (we keep the same exports).
4. New screen section in Profile → Voice settings: voice picker (lists
   `voicesForLocale`), rate slider, pitch slider, sample button.
5. **Acceptance:** APK installed on a Pixel + iPhone speaks an activity in
   the user's locale using a clearly higher-quality voice; settings
   persist across launches.

#### Phase 2 — STT + push-to-talk (2 weeks)

1. Add plugin: `pnpm add @capacitor-community/speech-recognition`.
2. Native permissions:
   - iOS `Info.plist`: `NSMicrophoneUsageDescription`,
     `NSSpeechRecognitionUsageDescription`.
   - Android `AndroidManifest.xml`: `RECORD_AUDIO`, `INTERNET` (already
     present).
3. `src/lib/voice/stt/sttAdapter.ts`: `start({ lang, partials: true })`,
   `stop()`, emits `partial` and `final` events via a typed `EventEmitter`.
4. New component `ConversationButton`:
   - Big circular mic button at the bottom of every primary screen,
     hidden when keyboard is open.
   - Hold-to-talk on phones; tap-to-toggle when accessibility "Hold
     gestures off" is on.
   - Live transcript shown above the button while user speaks.
5. New hook `useVoiceSession({ agent: "coach" | "counselor" | "narrator" })`
   wraps the FSM. Exports `state`, `transcript`, `start()`, `cancel()`,
   `isAvailable`.
6. **Acceptance:** Hold mic, say "what activity is good for a 3-year-old
   with sensory sensitivity" → text appears in the chat input within
   600 ms of release; agent responds in chat as today.

#### Phase 3 — Agent loop with talk-back + barge-in (2 weeks)

1. New Edge Function `supabase/functions/server/voice.ts` exposing
   `/voice/turn`. Accepts `{ agent, transcript, sessionId, locale }`,
   returns SSE stream of `{ delta, final }` so TTS can start speaking
   before the model finishes.
2. Wire the existing `/coach` and `/ai-counselor` system prompts but with
   a "voice-mode" prompt suffix: keep replies under 60 words, no
   markdown, end with a question if appropriate.
3. **Barge-in.** When STT detects speech while TTS is playing,
   `VoiceSession` calls `tts.stop()` immediately and transitions
   `speak → listen`. We sample mic energy at 60 Hz and use a
   simple voice activity detector (`WebRTC VAD` via WASM if needed) so
   barge-in works while TTS is loud.
4. **Safety filter.** Server-side: refuse / soften answers about medical
   diagnosis, custody, or safeguarding (regex blocklist + a tiny
   classifier prompt). Client-side: TTS refuses to speak text containing
   PII patterns (phone, email, address).
5. **Eyes-free affordances.** Subtle haptic on each state transition.
   Earcons (tiny chimes) at listen-start and listen-end via
   `native-audio`. Lock-screen media-session controls so users can
   pause/resume from the lock screen.
6. **Acceptance:** Full conversation works end-to-end — parent asks a
   follow-up while the previous answer is still being spoken; the app
   stops mid-sentence, listens, responds. Latency to first spoken
   syllable <1.2 s on a mid-range Android.

#### Phase 4 — Wake-word & always-listening (premium, 1 week)

- Picovoice Porcupine custom keyword "Hey Coach". On-device, ~60 KB model.
- Premium-only; explicit consent screen ("we will keep the microphone
  passively monitoring for the wake-word"). Mic indicator must always be
  honest.

### 2.6 Privacy & safety

- **Default:** all audio processed on-device; cloud sees text only.
- **Opt-in cloud STT** (premium, when on-device STT for the user's locale
  is poor): banner shows for the duration of each cloud-STT session;
  audio is sent to OpenAI Whisper via the Edge Function; not stored.
- **Children-by-default copy.** All voice prompts and responses pass
  through the existing safety filter used by `/coach` and `/ai-
  counselor`. Add child-mode TTS: if a child's voice is detected
  (high pitch, short utterance) the agent responds in simple language
  and does not collect data.
- **Visible mic indicator** whenever STT is open. iOS handles this at the
  OS level since 14; on Android we draw our own pulsing dot in the
  status bar.
- **Quiet by default.** TTS volume capped at 70 % of media volume so the
  app never startles a sleeping baby.

### 2.7 Telemetry & success metrics

| Metric | Target |
|--------|--------|
| % of weekly active users who complete ≥1 voice turn | 25 % within 6 weeks of launch |
| Avg STT first-partial latency | <600 ms p50 |
| Avg TTS first-syllable latency | <1.2 s p50 |
| Voice-session abandonment (no final transcript) | <8 % |
| Crash-free sessions in voice-mode | >99.5 % |
| Premium upgrade attribution from "voice" surface | tracked via UTM-equivalent on premium screen |

Implementation: extend `reportClientError(_, { screen })` to a sibling
`reportClientEvent(name, props)` that batches events and ships them
to the same monitoring sink (PostHog when wired).

### 2.8 Test strategy

- **Unit.** Adapter mocks for STT/TTS; FSM tests cover every transition
  (idle→listen, listen→think, think→speak, speak→listen barge-in,
  any→error).
- **Integration.** Vitest + jsdom test for `useVoiceSession` using the
  mock adapter; snapshot the chat thread after a scripted turn.
- **E2E.** Playwright test on the web build that uses
  `page.evaluate()` to inject canned transcripts into the mock STT
  adapter; confirms the agent reply appears in the DOM.
- **Device smoke.** Manual matrix: Pixel 6 (Android 14), Samsung A14
  (Android 13), iPhone 12 (iOS 17), iPhone SE 2 (iOS 16). Locales: en,
  hi, es. One test per locale per device, scripted.

### 2.9 Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Plugin abandonment (community plugins go stale) | Wrap in our own adapter so we can swap to an in-house plugin |
| OEM-specific STT bugs (Xiaomi, Vivo) | Feature-detect at runtime, fall back to push-to-text input with apology copy |
| Permission denial UX (user denies mic) | Show a friendly explainer + deep-link to OS settings; voice features stay hidden until granted |
| Latency on low-end Android | Cap response length to 60 words in voice mode; pre-warm TTS engine on app start |
| Privacy backlash | Prominent in-app explainer + a one-toggle "delete all voice data" button (since we keep none, this confirms instantly) |
| Cost blow-up on cloud STT | Hard cap of 60 s/turn and 30 turns/day per free user; premium gets 10× |

### 2.10 Definition of done

- Phases 1–3 shipped on Android + iOS.
- Voice settings live under Profile → Voice with picker, rate, pitch,
  cloud-STT opt-in toggle.
- Conversation button visible on Home, Coach, and Counselor screens.
- Telemetry dashboard shows the metrics above and they're within target
  for 7 consecutive days post-launch.
- Privacy doc + in-app explainer reviewed by a clinical advisor.

---

## Appendix A — Files this plan will touch (Phase 1–3)

```
src/lib/voice/tts/ttsAdapter.ts                 (new)
src/lib/voice/stt/sttAdapter.ts                 (new)
src/lib/voice/session/VoiceSession.ts           (new, FSM)
src/lib/voice/session/useVoiceSession.ts        (new, React hook)
src/lib/voice/voiceNarrator.ts                  (refactor → delegates to ttsAdapter)
src/components/voice/ConversationButton.tsx     (new)
src/components/voice/VoiceSettingsCard.tsx      (new, lives in Profile)
src/app/screens/ProfileScreen.tsx               (add Voice settings)
src/app/screens/HomeScreen.tsx                  (mount ConversationButton)
src/app/screens/AICounselorScreen.tsx           (mount ConversationButton)
src/components/coach/CoachChat.tsx              (mount ConversationButton)
supabase/functions/server/voice.ts              (new, /voice/turn)
supabase/functions/server/index.tsx             (mount /voice route)
ios/App/App/Info.plist                          (add Mic + SpeechRecognition usage)
android/app/src/main/AndroidManifest.xml        (add RECORD_AUDIO)
capacitor.config.ts                             (no change unless plugin needs ids)
package.json                                    (add tts + stt plugins)
```

## Appendix B — Where the old "Innovation Lab" copy went

- Public profile no longer shows the panel.
- Admin profile (allowlisted via `canAccessBlueprint(user)`) still shows
  it under the new heading **"Innovation Lab (admin)"** so we can keep
  it as a reference of what's already shipped.
- All ten items now live under "Tools & Features" in Profile, which
  routes to the actually-shipped screens.

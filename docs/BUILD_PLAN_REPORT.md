# NeuroSpark — Strategic Development & Build Plan Report

**Date:** March 2026  
**See also:** [MASTER_DEVELOPMENT_PLAN.md](./MASTER_DEVELOPMENT_PLAN.md) (full roadmap) · [AGENT_SELF_IMPROVEMENT_AND_QUALITY_SYSTEM.md](./AGENT_SELF_IMPROVEMENT_AND_QUALITY_SYSTEM.md) (quality & experiments) · [docs/README.md](./README.md) (index)  

**Purpose:** Align product ambition (“industry-leading parent guidance for raising cognitively sharp, physically coordinated, future-ready children—including healthy relationship with AI”) with **what exists in code** and **what must be built or improved**.

---

## 1. Vision reframing (strategic north star)

### 1.1 What “compete with AI” should mean (for children)

Avoid positioning as *“outscore machines on recall.”* LLMs excel at pattern completion and breadth. The durable human edge is:

| Human capability | Why it matters vs AI | How parents build it |
|------------------|----------------------|----------------------|
| **Judgment & calibration** | Knowing *when* to trust an answer, what to verify | Debate games, “two explanations” tasks, source literacy |
| **Embodied cognition** | Movement, timing, proprioception—no model “lives” in a body | Motor challenges, dual-task (move + think), sports + math |
| **Working memory under load** | Holding constraints while reasoning (distinct from chat context) | N-back lite, mental math while moving, sequencing |
| **Creativity with constraints** | Novelty *within rules* (design, storytelling, builds) | Limited-material builds, “invent a rule” games |
| **Social–emotional agility** | Negotiation, empathy, repair—multimodal and contextual | Role-play, Nunchi-style reading, conflict scripts |
| **Metacognition** | “What do I know / not know?” planning and reflection | Post-activity prompts, error celebration, learning journals |
| **Speed with *accuracy*** | Fluency built on understanding, not anxiety | Timed drills paired with “explain why” checkpoints |

**Product promise (recommended):**  
*“NeuroSpark helps parents systematically develop **integrated cognition**—fast, flexible thinking **grounded in body, emotion, and ethics**—so children thrive **with** AI, not **as** AI mimics.”*

### 1.2 “Best in industry” criteria (measurable)

1. **Evidence traceability** — activities linked to mechanisms (working memory, EF, phonological loop, etc.) and age windows.  
2. **Personalization depth** — child profile + history changes *what* is recommended, not only copy.  
3. **Adherence support** — frictionless daily loop, reminders, streaks that don’t shame.  
4. **Outcome proxies** — repeatable micro-assessments (parent-reported + short in-app checks), not only badges.  
5. **Safety** — COPPA-aware flows, clear AI disclaimers, no medical claims.  
6. **Parent efficacy** — scripts, “if child resists,” 60-second coaching per activity.

---

## 2. Codebase inventory — what is **built** today

### 2.1 Application shell & UX

| Area | Status | Notes |
|------|--------|--------|
| Mobile-first “phone frame” layout | ✅ | `App.tsx` — polished marketing-style shell |
| Navigation (views + bottom nav) | ✅ | Home, Today (generate), Brain, AI Help, Profile |
| Error boundary | ✅ | `ErrorBoundary.tsx` |
| Large UI kit (Radix/shadcn-style) | ✅ | Many `components/ui/*` — available for future features |

### 2.2 Core product loop

| Feature | Status | Implementation |
|---------|--------|----------------|
| Child profiles (multi-child, DOB → age tier) | ✅ | `AppContext` + `getAgeTierFromDob` |
| Onboarding | ✅ | `OnboardingScreen` |
| **Activity generator (AGE)** | ✅ | `runAGE()` in `activities.ts` — scoring, materials filter, mood, time budget, diversity heuristics |
| Activity catalog | ✅ | **~25+** structured `Activity` objects in `activities.ts` (instructions, materials, intelligences, mood tags) |
| Daily pack UI + completion + confetti | ✅ | `GeneratorScreen.tsx` |
| History / journey | ✅ | `HistoryScreen` + `ActivityLog` |
| Stats & progression | ✅ | `StatsScreen`, brain points, levels, streaks |
| Gamification (badges) | ✅ | `BADGE_DEFS` + `updateChildBadges` |
| Year roadmap content | ✅ | `yearPlan.ts` + `YearPlanScreen` |
| Milestones | ✅ | `MilestonesScreen` + `milestones.ts` |
| “Know your child” / KYC | ✅ | `BrainMapScreen`, `KYCData` in context |
| Paywall + credits | ✅ | Credits in context; `PaywallScreen` (Razorpay via Supabase Edge Functions) |
| AI Counselor | ✅ | `AICounselorScreen` — calls Edge Function (needs env: `VITE_SUPABASE_*`) |

### 2.3 Auth & data persistence

| Feature | Status | Gap |
|---------|--------|-----|
| “Auth” UI | ✅ | **Mock only** — `setTimeout` + `loginUser`; no token, no server validation |
| Persistence | ✅ | **localStorage** (`neurospark_v2`) only |
| Cloud sync / Supabase Auth | ❌ | Not integrated for app state |
| Multi-device | ❌ | Impossible without backend account model |

### 2.4 Backend / Supabase

| Piece | Status |
|-------|--------|
| Edge Functions server (`supabase/functions/server`) | Present — Hono app, KV store patterns |
| AI + Razorpay routes | Referenced from client URLs |
| Client Supabase config | `src/utils/supabase/info.ts` — env-based `projectId` / `anon key` |

### 2.5 “Blueprint” (research & product spec in-app)

| Content | Status |
|---------|--------|
| Research framework, 13 intelligences, age matrix, algorithm narrative, DB narrative, materials, features, roadmap sections | ✅ Large `blueprint/data.ts` + section components |
| Activity simulator / developmental widgets | ✅ Several blueprint components |

**Interpretation:** The **intellectual property and narrative** are unusually strong for an early app; the gap is **closing the loop** between that spec and **runtime behavior** (more content, smarter engine, assessments, cloud).

---

## 3. Gap analysis — ambition vs current build

### 3.1 Cognitive depth

| Ambition | Current | Gap |
|----------|---------|-----|
| “Ultra fast thinking” | Speed is not explicitly trained (no timed ladders, fluency progressions) | Add **graded speed layers** (accuracy first, then fluency) per age tier |
| “Compete with AI” | Not addressed in UX copy or structured skills (media literacy, verification) | Add **AI literacy** pillar: age-appropriate “human + tool” activities |
| Rich executive function | Some activities tag EF; not sequenced as a **program** | EF **learning paths** (3–4 week micro-curricula) |
| Physical + cognitive dual task | Limited explicit “move while think” | New activity family + tagging |

### 3.2 Content scale

| Spec (blueprint) | Code | Gap |
|------------------|------|-----|
| Hundreds of activities / tier | ~25+ in `ACTIVITIES` | **Order-of-magnitude content expansion** or generative pipeline with human review |
| Full algorithm (history, spaced repetition flags) | `runAGE` uses recent IDs only; no spaced repetition engine | Implement **rules from blueprint** in code + persistence |

### 3.3 Personalization

| Desired | Current | Gap |
|---------|---------|-----|
| KYC drives recommendations | KYC stored; **generator does not read `kycData`** | Wire `runAGE` (or pre-filter) to KYC + preferences |
| Per-child difficulty | Fixed tier from DOB only | Optional **manual tier override** + “challenge mode” |
| Material inventory | Used in generator | Good — extend with **photo or checklist persistence** per home |

### 3.4 Trust, safety, compliance

| Topic | Current | Gap |
|-------|---------|-----|
| Medical claims | Parent tips cite research informally | Legal review + **softer wording** + disclaimers |
| COPPA / children’s privacy | Local-only child data | If cloud: **parent gate**, data minimization, DPA |
| AI Counselor | Educational positioning needed | Clear **“not medical / not therapy”** UX |

### 3.5 Growth & platform

| Topic | Current | Gap |
|-------|---------|-----|
| Distribution | Web (Vite) | PWA / **Capacitor** for App Store / Play |
| Notifications | None | Re-engagement for streaks (careful with ethics) |
| i18n | English-first | If India/global is core, **localization** |

---

## 4. Recommended build phases (prioritized)

### Phase A — **Foundation** (0–6 weeks): trustworthy core

1. **Real authentication & profiles** — Supabase Auth (email/OAuth); migrate `Persisted` state to **RLS-protected tables** (users, children, logs, credits).  
2. **Environment & ops** — Document all env vars; staging project; error monitoring (e.g. Sentry).  
3. **Wire KYC → generator** — Pass `learningStyle`, sliders into `runAGE` scoring.  
4. **Spaced repetition v1** — Store `lastCompletedAt` per activity id; boost or ban repeats per blueprint rules.  
5. **Legal copy** — Terms, privacy, AI disclaimer on counselor screen.

**Exit criteria:** Same app works **signed-in across devices**; generator behavior measurably changes when KYC changes.

### Phase B — **Differentiation** (6–14 weeks): “best parent guidance”

1. **Parent coaching layer** — For each activity: “60s science,” “if child resists,” “simplify / extend.” (Partially exists as `parentTip` — **standardize and surface**.)  
2. **Outcome proxies v1** — Monthly **12-question parent checklist** (attention, persistence, emotional regulation) + sparkline in Stats.  
3. **AI literacy track** — 4–6 activities per tier: verification, “ask the machine vs ask yourself,” bias games.  
4. **Dual-task / coordination track** — Tag + filter activities; minimum one per week in default pack when enabled.  
5. **Content expansion** — Target **100+** reviewed activities OR hybrid **human-reviewed templates** (do not ship unchecked LLM activities to kids without review).

**Exit criteria:** Unique narrative + **measurable** progress signals competitors rarely combine.

### Phase C — **Scale & polish** (3–6 months): industry leadership

1. **Adaptive difficulty** — Bayesian or simple heuristic: engagement ratings + time-on-task adjust difficulty tier.  
2. **Expert & school modes** — Export PDF weekly plan; educator dashboard (B2B2C).  
3. **PWA + push** (opt-in) — Respectful reminders.  
4. **Clinical advisory** — Optional partnership for **validation study** (even small-n pilot → huge credibility).  
5. **Performance** — Code-split routes; lazy blueprint; image CDN strategy.

### Phase D — **Moat** (6–18 months)

- **Longitudinal dataset** (with consent) for research publications.  
- **Certified coach** add-on (human in the loop).  
- **API** for wearables / motor apps (coordination metrics).

---

## 5. Technical workstream checklist

| ID | Workstream | Priority | Owner skill |
|----|------------|----------|-------------|
| T1 | Supabase schema: `profiles`, `children`, `activity_logs`, `credits`, `kyc` | P0 | Full-stack |
| T2 | Migrate localStorage → Supabase with one-time import | P0 | Full-stack |
| T3 | `runAGE` + KYC + spaced repetition | P0 | Frontend + logic |
| T4 | Harden Edge Functions (auth on AI/payment routes) | P0 | Backend |
| T5 | Typecheck in CI (`pnpm typecheck`) + lint | P1 | DevOps |
| T6 | E2E smoke (Playwright): login, generate, complete | P1 | QA |
| T7 | Content CMS or MD pipeline for activities | P1 | Content + eng |
| T8 | PWA manifest + service worker | P2 | Frontend |
| T9 | i18n framework | P2 | Frontend |

---

## 6. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Overclaiming (“genius,” “beat AI”) | Evidence-based copy; focus on **habits and mechanisms** |
| Parent guilt from streaks | “Rest days,” streak freeze, positive framing |
| AI Counselor liability | Disclaimers; escalate to professionals copy; log version |
| Content quality at scale | Editorial workflow; age tags; method citations |
| Dependency on Unsplash | Own illustrations or licensed set for kids’ privacy/branding |

---

## 7. Summary

**Strengths in repo:** Strong **UX shell**, **documented science narrative**, a **working activity engine**, **gamification**, **multi-child** support, **paywall/AI** hooks, and a **substantial blueprint** that reads like a product thesis.

**Critical gaps:** **No real auth/cloud sync**, **KYC not affecting generation**, **catalog size vs spec**, **no spaced repetition / history-aware algorithm as designed**, **AI-human skill framing** not yet a first-class pillar, **limited explicit training for speed-with-accuracy and dual-task coordination**.

**Recommended immediate focus:** Phase A (auth + sync + KYC + spaced repetition + legal) **then** Phase B (coaching layer, outcomes, AI literacy, content scale).

---

*This report is derived from repository review (`App.tsx`, `AppContext.tsx`, `activities.ts` / `runAGE`, main screens, Supabase functions layout, blueprint modules). Update quarterly as shipped features change.*

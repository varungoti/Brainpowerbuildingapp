# NeuroSpark — Master Development Plan (Exhaustive)

**Version:** 1.0 · **March 2026**  
**Audience:** Product, engineering, content, and AI-assisted contributors  
**Companion docs:** [BUILD_PLAN_REPORT.md](./BUILD_PLAN_REPORT.md) · [AGENT_SELF_IMPROVEMENT_AND_QUALITY_SYSTEM.md](./AGENT_SELF_IMPROVEMENT_AND_QUALITY_SYSTEM.md) · [rubrics/DELIVERABLE_SCORECARD.md](./rubrics/DELIVERABLE_SCORECARD.md)

---

## Part A — Purpose & research foundation

### A.1 Mission

Equip parents with **evidence-aligned, personalized, daily practice** so children develop **integrated cognition**: executive function, language and numeracy foundations, spatial and motor skill, social–emotional competence, creativity within constraints, and **healthy agency alongside AI tools**—without medical overclaiming.

### A.2 Research pillars (synthesis)

| Domain | Mechanisms to respect | Design implication |
|--------|----------------------|-------------------|
| **Neuroplasticity & sensitive periods** | Windows for language, phonology, motor refinement | Age-tier calibration; avoid one-size-fits-all |
| **Executive function** | Inhibition, WM, cognitive flexibility | Sequenced challenges; fatigue-aware scheduling |
| **Motor–cognition coupling** | Cerebellum, dual-task integration, BDNF | Explicit movement + thinking activities |
| **Stress & learning** | Amygdala interference with PFC | Sensitivity-aware recommendations; calm options |
| **Spaced practice** | Distributed retrieval strengthens encoding | History-aware repetition rules (engine) |
| **Motivation** | Autonomy, competence, relatedness (SDT) | Child-led variants; parent scripts; no shame streaks |
| **AI era skills** | Calibration, verification, human judgment | Dedicated “human + tool” literacy track (content) |

*Primary references families: developmental cognitive neuroscience, Gardner-inspired multi-intelligence *as a planning lens* (not IQ claims), Montessori/Waldorf/regional pedagogies as *activity methods*, not unproven “brain training” hype.*

### A.3 Positioning guardrails

- **Do not** claim to diagnose, treat, or cure conditions.  
- **Do** frame outcomes as **habits, engagement, and parent-reported developmental proxies**.  
- **“Compete with AI”** = develop **human-complementary** capabilities (see BUILD_PLAN_REPORT §1.1).

---

## Part B — Product architecture (target state)

### B.1 User journeys

1. **Acquire** → Landing, value prop, trust (science citations, privacy).  
2. **Activate** → Auth, child profile, materials, KYC (“Know your child”).  
3. **Core habit** → Daily pack generation → complete → log → streak/level.  
4. **Deepen** → Year plan, milestones, stats, brain map updates.  
5. **Support** → AI counselor (bounded), paywall/credits.  
6. **Retain** → Gentle reminders, streak freeze, new content drops.

### B.2 Data architecture (target)

| Layer | Today | Target |
|-------|-------|--------|
| Identity | Mock auth | **Optional Supabase Auth** when `.env` set; RLS + child sync still TODO |
| Profiles | localStorage | `children`, `profiles` tables |
| Activity logs | localStorage | Append-only logs + aggregates |
| KYC | localStorage | Synced; **drives generator** ✅ (v1 shipped in code) |
| Payments | Edge functions | Harden + webhook idempotency |

### B.3 Algorithm roadmap (AGE — Activity Generation Engine)

| Capability | Status | Priority |
|------------|--------|----------|
| Tier + materials + mood + time | ✅ | — |
| Recent-ID anti-repeat | ✅ | — |
| Region / intelligence diversity | ✅ | — |
| **KYC personalization** | ✅ v1 | Extend with validated weights |
| Spaced repetition (24h + 3–7d boost) | ✅ v1 | Tune weights with analytics |
| Engagement feedback loop (ratings → difficulty) | ❌ | P1 |
| Seasonal / weekly themes | ❌ | P2 |

---

## Part C — Workstreams (exhaustive checklist)

### C.1 Platform & reliability

- [x] Supabase schema migration plan + RLS policies — `SUPABASE_SCHEMA_PLAN.md` + `00001` / `00002` SQL sketches (wire app when sync ships)  
- [x] Real auth; session refresh; logout clears server session — Supabase `onAuthStateChange`, awaited `signOut`, visibility `getSession` (`AppContext`, `SUPABASE_AUTH.md`)  
- [x] localStorage → cloud import wizard (v1) — Profile **Backup & new device** + `docs/DATA_SYNC_AND_BACKUP.md` (automatic cloud sync still TODO)  
- [x] Local pre-merge gate: `pnpm run verify` (typecheck + Vitest + build)  
- [x] CI: GitHub Actions — `pnpm typecheck`, `lint`, `test`, `build` (`.github/workflows/ci.yml`)  
- [x] Minimal E2E (Playwright smoke: `pnpm run test:e2e`, CI after build)  
- [x] Env documentation; staging notes — `docs/ENVIRONMENT_AND_STAGING.md` (separate Supabase deploys still on you)  
- [x] Error monitoring — optional Sentry (`VITE_SENTRY_DSN`, prod-only; `docs/ERROR_MONITORING.md`)  
- [x] Accessibility baseline: skip link, `main` landmark (`#app-main`), bottom nav `aria-label` / `aria-current`, back button `aria-label` (full contrast audit still TODO)

### C.2 Core product

- [x] KYC signals influence `runAGE` scoring (v1)  
- [x] Spaced repetition in `runAGE` + AGE trace line (v1)  
- [x] “Why this activity?” parent line (`activityWhy.ts` + Generator cards) tied to KYC + tier + spacing  
- [x] Outcome checklist (monthly parent proxy) + sparkline on Stats  
- [x] AI literacy activity track (tagged activities a26–a29 + a16, generator toggle, AGE swap-in) + counselor category & copy alignment  
- [x] Dual-task / coordination tags on select activities + generator “Prefer dual-task” boost (weekly minimum deferred)  
- [x] In-app legal/privacy/AI draft summaries (`legal_info` screen, Profile link) — replace with counsel-reviewed text before marketing  

### C.3 Content

- [x] Editorial workflow (draft → review → publish) — starter process in `docs/CONTENT_EDITORIAL_WORKFLOW.md` (CMS/tooling optional)  
- [ ] Expand catalog toward 100+ reviewed activities  
- [ ] Per-activity: mechanism tags, contraindications, duration variants  
- [ ] Replace transient stock imagery with owned/illustrated assets (privacy & brand)

### C.4 Monetization & compliance

- [x] Paywall / product analytics (funnel, no PII) — `productAnalytics.ts` + optional `VITE_ANALYTICS_ENDPOINT`  
- [x] Terms, Privacy, AI disclaimer, refund policy — in-app **draft** tabs + counsel handoff `docs/LEGAL_PUBLISHING_CHECKLIST.md` (replace before marketing)  
- [x] COPPA/GDPR-K engineering checklist (`docs/COPPA_GDPR_CHECKLIST.md`) — counsel review still required before marketing  

### C.5 Growth

- [x] PWA shell: `manifest.webmanifest` + meta `theme-color` + installable baseline (add maskable PNG icons under `public/icons/` for full store-style install prompts)  
- [ ] Optional push (opt-in)  
- [ ] Referral / family plan (optional)  
- [ ] Localization (e.g. Hindi) if market requires  

---

## Part D — Phased timeline (recommended)

| Phase | Duration | Focus | Exit criteria |
|-------|----------|-------|----------------|
| **D0** | Done | Docs + KYC→AGE v1 | `docs/*` plan set; `runAGE(..., personalization)` + `GeneratorScreen` pass `kycData[childId]` |
| **D1** | 4–8 wks | Auth + DB + sync | Multi-device same account |
| **D2** | 6–10 wks | Spaced rep + outcomes v1 | History changes repeats; monthly checklist live |
| **D3** | 8–14 wks | Content + AI literacy | 100+ activities or reviewed pipeline; new track shipped |
| **D4** | Ongoing | Adaptive + B2B optional | Rating-driven tuning; school export pilot |

---

## Part E — Success metrics

### E.1 Product

- D7 / D30 retention (parent session)  
- % days with ≥1 completed activity per active child  
- Diversity: avg distinct intelligences per 7-day window  
- Paywall conversion (if applicable)  
- NPS or in-app CSAT (quarterly)

### E.2 Quality (delivery)

- Rubric composite score trend per sprint (see AGENT doc)  
- Regression: **no drop** in “Child outcome proxy” dimension after changes  
- Open defects P0/P1 count

### E.3 Science integrity

- % new activities with mechanism tag + age justification  
- Legal review clearance for marketing claims

---

## Part F — Dependencies & risks

- **Content velocity vs quality:** use rubric + experiment log; no unreviewed LLM-only activities for children.  
- **Overpersonalization:** keep diversity constraints so one trait doesn’t collapse variety.  
- **Vendor lock-in:** keep activity definitions in repo or portable CMS export.

---

## Part G — Document control

| Document | Owner | Review cadence |
|----------|-------|------------------|
| This plan | Product lead | Quarterly |
| BUILD_PLAN_REPORT | Product + Eng | Quarterly |
| AGENT_SELF_IMPROVEMENT… | Eng + QA | Monthly |
| EXPERIMENT_LOG | Contributors | Weekly update |

---

*End of Master Development Plan.*

# NeuroSpark — Production readiness audit & build plan

This document is a candid audit of the current **Vite + React + Capacitor** codebase and a phased plan to reach **ultra production-ready** quality for parents, app stores, and operations.

---

## 1. Executive summary

The app is **strong on product vision and local-first UX** (activities, brain map, milestones, backup, PWA, optional Supabase). It is **not yet “production complete”** for a mass-market child/family product because several pillars—**trust, security hardening, store compliance, content governance, observability, and native polish**—still need deliberate work and owner sign-off.

**Recent improvements in-repo:** internal Blueprint docs are **admin-gated** (build-time email allowlist); **text scaling** is available in Profile and persists via `localStorage` and **Capacitor Preferences** on native; **AGE algorithm trace** is **dev-only** in production builds.

---

## 2. Honest gap audit (current state)

### Product & trust

- **Claims vs catalogue:** Marketing copy historically referenced very large activity counts; the catalog is **finite and versioned**. All customer-facing numbers must be **audited against `ACTIVITIES` and `content:validate`** before launch.
- **“Innovation Lab” and roadmap copy:** Fine for beta; for production, either **remove**, **label as “Coming soon”**, or **tie to a public roadmap** to avoid over-promising.
- **Payments:** Razorpay integration exists but **live keys, reconciliation, refunds, and tax** need business + legal process, not only code.

### Security & privacy (COPPA / family apps)

- **Data classification:** Backups contain **child names and progress** — treat as **sensitive**; document retention, deletion, and parent rights.
- **Auth:** Mock signup + optional Supabase — define **one primary auth story** for production (e.g. Supabase email only) and **remove or fence** mock flows.
- **Secrets:** Ensure `.env` never ships; CI uses **masked** vars; rotate keys if ever leaked.
- **Admin / internal surfaces:** Blueprint is gated by **`VITE_ADMIN_EMAILS`** — this is **obfuscation, not DRM**. For stricter separation, serve admin docs from a **separate host** or **staff-only SSO** (see plan below).

### Reliability & quality

- **E2E coverage:** Core flows exist; expand to **paywall (mocked)** , **backup round-trip**, **generator credit edge cases**, and **offline** scenarios.
- **Error boundaries:** Present; ensure **every async screen** has user-safe fallbacks and **no raw stack traces** in UI.
- **API failure modes:** AI Counselor and paywall already degrade; re-audit copy and **telemetry** (privacy-light) for failures.

### Mobile (Capacitor)

- **Permissions:** Add explicit **Android/iOS permission rationale** in store listings when you add camera, notifications, etc.
- **Safe areas & keyboard:** Test **notch, home indicator, and keyboard** on real devices; adjust shell if you drop the “phone frame” on real installs.
- **Deep links & domain:** Universal links / app links for **password reset and marketing** if using Supabase Auth on web + app.
- **Release signing:** Debug APK is not store-ready; **release keystore**, **Play App Signing**, and **iOS certificates** are required.

### Legal & stores

- **Privacy policy & terms:** Must match **actual data flows** (Supabase, analytics, Sentry, Razorpay, OpenAI on server).
- **Age rating & parental gate:** Align questionnaire answers with **real features** (AI, payments, social if any).
- **AI disclosure:** Clear **when output is demo vs live model**; avoid medical claims; **red flags** copy already points to professionals — keep consistent everywhere.

### Observability

- **Sentry:** Optional; confirm **PII scrubbing** and **environment** tags.
- **Analytics:** Privacy-light events exist; define **dashboards** and **alerts** for error rate and conversion.

---

## 3. Phased build plan (recommended order)

### Phase A — “Safe to ship a closed beta” (1–2 weeks, focused)

| Item | Action |
|------|--------|
| Copy & claims | Audit all user-visible numbers and superlatives; align with catalog and `age:report`. |
| Env & config | Document required env vars; staging vs production projects for Supabase. |
| Admin content | Keep Blueprint admin-only; optional **separate static site** for internal docs. |
| E2E | Add backup restore + one paywall path (mocked network). |
| Accessibility | Text scale shipped; add **contrast pass** on primary buttons and focus rings. |

### Phase B — “Store submission ready” (2–4 weeks)

| Item | Action |
|------|--------|
| Android | Release **AAB**, `versionCode`/`versionName`, ProGuard/R8 rules, **privacy manifest** in Play form. |
| iOS | Mac + Xcode: **pods**, **signing**, **App Privacy** labels, **ATT** if applicable. |
| Payments | Production Razorpay + **webhook** or server verification flow documented; refund policy in-app. |
| Content | Editorial workflow for activities (`reviewStatus`, `content:validate` in CI — already present). |

### Phase C — “Ultra production” (ongoing)

| Item | Action |
|------|--------|
| Security review | Third-party or checklist: OWASP MASVS for mobile, STRIDE for backend. |
| Performance | Bundle budget, lazy routes audit, image CDN policy for `GeneratorScreen` remote images. |
| i18n | If targeting multiple locales, extract strings and RTL test. |
| Feature flags | Remote config for risky features (AI, experiments) without app store delay. |
| DR | Backup encryption option; export format versioning (already in backup util — extend as needed). |

---

## 4. Admin-only internal documentation (recommended hardening)

**Today:** `VITE_ADMIN_EMAILS` + navigation guard + Profile section for admins.

**Stronger (optional):**

1. **Separate admin web app** (Vite or static) deployed on `admin.yourdomain.com` with **Google Workspace SSO** or **Supabase role = admin** from JWT claims.
2. **Remove `blueprint` route from consumer app entirely**; link admins to the external site only.
3. **Server-side** PDF or Notion for legal/compliance reviews instead of in-app scroll.

---

## 5. Definition of “ultra production ready” (checklist)

- [ ] Privacy policy & terms reviewed by counsel; match implemented behavior.
- [ ] COPPA/GDPR-Kids posture documented; parental email verified if required.
- [ ] No dev-only UI in production builds (AGE trace, debug banners).
- [ ] Sentry + analytics configured for prod with sampling and no PII.
- [ ] CI: typecheck, lint, unit tests, `content:validate`, `age:report`, E2E on preview build.
- [ ] Capacitor: signed release AAB/IPA; crash-free sessions monitored.
- [ ] Incident runbook: who rotates keys, who owns Supabase project.
- [ ] Support channel and in-app “Contact / Help” visible.

---

## 6. Ownership

Assign a **single release owner** per platform (Android / iOS / Web) to drive store forms, screenshots, and version cadence. Revisit this document **after each major release** and tick items in Section 5.

**Human-only tasks** (outside the repo): see **[OWNER_ACTION_CHECKLIST.md](./OWNER_ACTION_CHECKLIST.md)**. Environment matrix: **[ENVIRONMENTS.md](./ENVIRONMENTS.md)**. Incidents: **[INCIDENT_RUNBOOK.md](./INCIDENT_RUNBOOK.md)**.

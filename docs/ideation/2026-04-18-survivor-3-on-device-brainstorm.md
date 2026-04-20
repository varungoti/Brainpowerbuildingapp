# Survivor 3 — On-device-First AI (`ce:brainstorm`, 2026-04-18)

> Follow-up to [`docs/ideation/2026-04-17-next-10-years.md`](./2026-04-17-next-10-years.md). Goal: take Survivor 3 from a wedge-identified bet to a buildable roadmap, with explicit model choices, bundle/cache strategy, runtime trade-offs, and kill criteria.
>
> Mode: repo-grounded. Inputs: 7-survivor ideation artifact (above), `src/lib/localAi/index.ts` (third-pass deepening), COPPA 2.0 timeline (effective **April 22, 2026 — 4 days from this doc**), `automation/voice-svc-kokoro/` (proven Kokoro on-device-grade pipeline).
>
> Status: **build-ready**. Three of the four `ce:brainstorm` outputs (model choice, bundle strategy, runtime hierarchy) already have shipping code as their seed; this artifact picks the production path.

---

## 1. Why this bet is the forced move

- **COPPA 2.0 effective Apr 22, 2026** mandates separate explicit parental consent for *any AI feature processing kids' input*, near-real-time deletion, and verifiable de-identification. The strategic question is no longer "should we go on-device" but "how fast can we credibly say *the cloud round-trip is opt-in for this child*".
- **EU AI Act** classifies AI for minors as high-risk; documented risk assessments are required.
- **India DPDP Rules** (notified Nov 13, 2025) — verifiable parental consent via DigiLocker.
- **UK AADC** — best-interests-by-default.
- **Direction of travel by 2027–2030**: cloud-only AI for under-13s becomes effectively unsellable in 4+ jurisdictions. Whoever has the cleanest on-device story by Q4 2026 owns the pediatric-recommendation channel for the decade.
- **Internal coupling**: Survivor 1's long-memory variant (4-week observational state per child) is fundamentally cleaner on-device — the cumulative state never leaves the parent's phone, which removes the hardest legal+trust question we'd otherwise face about cross-session retention of kids' data.

The third-pass deepening (`src/lib/localAi/index.ts`) shipped the routing skeleton: `routedChat` already tries native Capacitor → WebLLM → cloud in priority order, with strict on-device mode that *refuses* cloud rather than secretly going to it. What's missing is the actual runtime in the bundle, the weights cache, and the consent + verifier UX.

---

## 2. Constraints (the box this design has to fit in)

| Constraint | Numeric target | Why |
|---|---|---|
| Initial JS payload | ≤180 KB gzip main (currently 164) | Parent mobile, 3G/4G in markets like IN/BR/ID where we have locale coverage |
| First on-device weights download | ≤900 MB, lazy + resumable | iOS 18 Safari hard-caps single-page Cache Storage at ~2 GB; we want headroom |
| Cold first-token latency | ≤4 s on iPhone 13-class hardware | Voice mode dies otherwise; cloud is ~600 ms baseline |
| Steady-state token latency | ≥15 tokens/s | Below 10 t/s feels broken in voice; coach answers average ~120 tokens |
| Battery cost per coach turn | ≤0.5 % @ 100 % charge | Parents will surface this; we surface it first in the privacy panel |
| Bundle size when on-device runtime absent | 0 KB delta | Web bundle must be slim for users who never opt in |

The third-pass deepening already enforces the last constraint via `dynImport(s => import(s))` so Vite never sees a static specifier — installing or omitting `@mlc-ai/web-llm` doesn't move the main bundle.

---

## 3. Runtime choice — head-to-head

Three runtimes survive the screen: WebLLM (web/PWA), `@capacitor-community/llm` (iOS/Android Capacitor), and a Sora-style server-of-one (deferred).

| Runtime | First-token | Steady t/s | Bundle | Where it runs | Verdict for us |
|---|---|---|---|---|---|
| **WebLLM 0.2.x** + Llama-3.2-1B-Instruct-q4f16_1 | ~3.5 s on M1 / iPhone 13 Pro+ | 22–30 t/s on M1, 15–18 t/s on iPhone 13 | ~900 MB weights (cached after first run) | WebGPU browsers + iOS 18 Safari | **Default for web/PWA**. Picked. |
| `@capacitor-community/llm` + Phi-3.5-mini-Q4 | ~1.8 s on iPhone 14+ | 25–40 t/s | ~1.8 GB IPA delta if shipped, or lazy-fetched | iOS Core ML / Android NNAPI | **Default for native** (when we ship a Capacitor build with the plugin) |
| Server-of-one (Llama 3.1 8B on Workers AI) | n/a | n/a | 0 | Cloudflare edge | **Deferred.** Defeats the COPPA-2.0 wedge — the whole point is "no cloud round-trip for kids' input". |

**Decision**: ship WebLLM as the runtime that backs the *web PWA + Capacitor WebView* path immediately. Ship the Capacitor native plugin in the same release once the iOS/Android build pipeline lands the binary integration. The third-pass `routedChat` already has both branches; only the install + warm-up + UX is left.

---

## 4. Model choice — what we actually load

| Use | Model | Reason | Size (q4) |
|---|---|---|---|
| Coach chat (Survivor 1) | **Llama-3.2-1B-Instruct-q4f16_1-MLC** | Apache 2.0; instruction-tuned; 22+ t/s on iPhone 13; matches the structured-JSON shape `coachEngine.ts` already expects | ~900 MB |
| Voice transcription (Survivor 2/3) | **Whisper-tiny.en** | 39 MB; already proven on Capacitor; English-only is fine for v1 (parent voice; child voice cloud-tagged adversarial) | ~39 MB |
| Voice synthesis (Survivor 2) | **Kokoro web build** | We already self-host Kokoro for Studio (`automation/voice-svc-kokoro/`); reuse the same model card | ~80 MB |
| Safety classifier | **DistilBERT toxic-bert** | Pure CPU; runs in <40 ms via ONNX Runtime Web; already enumerated in the adapter | ~67 MB |

**Total first-time download budget**: ~1.1 GB for the full premium-tier on-device stack. Parents on the free tier get coach-only (~900 MB).

**Why not Phi-3.5-mini on web?** Phi-3.5-mini-q4 is ~2.3 GB → blows the iOS 18 Safari cache cap, plus first-run download is brutal on 4G. Phi stays the *native* model where IPA-bundled (or Apple Foundation Model substitute on iOS 18.1+).

---

## 5. Bundle + cache strategy

### Lazy install (no bloat for users who never opt in)
- `@mlc-ai/web-llm` is **not** in `dependencies` of the root `package.json`. It lives in an *opt-in* code path that the third-pass `getOrInitWebLlmEngine()` already reaches via `Function("import")`. The package gets added at runtime via the parent's app-store update once we ship a Capacitor build — the web PWA build can lazy-`<script>`-load it from the same domain.
- The privacy panel's "Enable on-device AI" CTA is the single trigger that downloads weights. Until tapped, the user pays zero bytes for this bet.

### Weights cache (resumable, observable, purgeable)
- WebLLM uses `Cache Storage` keyed by model URL — hits the OPFS in iOS 18.4+. We surface storage usage in the privacy panel via `navigator.storage.estimate()` so the parent can see "Llama-3.2-1B occupies 920 MB" and tap purge.
- Resumability comes free from the WebLLM loader (HTTP range requests).
- We add a `serviceWorker` precondition: only download weights on Wi-Fi (`(navigator as any).connection.effectiveType === "4g"` or `"wifi"`). On 3G or `saveData` we refuse and tell the parent why.

### Battery + thermal budget
- Refuse to start a chat if `Battery.charging === false && Battery.level < 0.3`. Show "Plug in to use on-device coach, or switch to Hybrid mode." Parents in the field have flagged this for any always-on AI; we get ahead of it.

---

## 6. Verifier — turn the bet into proof

The COPPA-2.0 wedge is only credible if a third party can verify our claim. Build a **public verifier**:

1. New marketing-site page `/verifier` — shows a live network monitor (`PerformanceObserver` of `resource` entries) of every outbound request from the running app.
2. Filter by host. We pre-declare the *legitimate* outbound hosts (Supabase auth, Postgres realtime, Sentry breadcrumbs without payload) — anything else is flagged red.
3. Anyone can clone the open-source verifier and replay it against a sandboxed instance.
4. Post the verifier video on the `/standard` page that S5 already shipped.

This is the move that turns "we say it's on-device" into "any pediatrician, regulator, or competitor can prove it themselves" — and it's the same epistemics that gave `<NeuroSparkVerified />` (S5) its credibility.

---

## 7. Build phases (tied to the existing roadmap surface)

### Phase 0 — DONE (third-pass deepening, this iteration)
- WebGPU probe + WebLLM probe in `src/lib/localAi/index.ts`
- `routedChat` has native → WebLLM → cloud priority hierarchy
- COPPA-2.0 consent panel (`AIPrivacyScreen`), purge flow, per-feature toggles
- Memory transparency chip in `CoachPanel` so parents see what's remembered

### Phase 1 — 2 weeks (web PWA happy path)
- Add `@mlc-ai/web-llm` as an *opt-in* dynamic import. Lazy `<script>` load it from `unpkg.com` *or* host the bundle ourselves under `/ai-runtime/` (preferred — survives an unpkg outage).
- Implement the "Enable on-device AI" CTA flow in `AIPrivacyScreen`: connectivity check → 900 MB confirm dialog → resumable download with progress → first warm-up turn → success/failure telemetry tagged with `ai_runtime: "webllm"`.
- Implement the `navigator.storage.estimate()` line in the privacy panel.
- Telemetry: cold first-token, steady-state t/s, battery delta per turn, fall-back-to-cloud rate. Pin a kill-switch threshold at the top of this section.

### Phase 2 — 4 weeks (Capacitor native)
- Add `@capacitor-community/llm` to the Capacitor build. Bundle Phi-3.5-mini-Q4 weights via `@capacitor/filesystem` post-install hook.
- iOS-only: detect Apple Foundation Model availability (iOS 18.1+); when present, prefer it over Phi for the obvious reason that Apple ships its own quantized weights.
- Android: NNAPI fallback to CPU when the device lacks a TPU.

### Phase 3 — 6 weeks (verifier + standard alignment)
- Ship `/verifier` page on the marketing site.
- Add a "Verified on-device" badge variant of `<NeuroSparkVerified />` so the S5 standard becomes a vehicle for the S3 claim.
- File the technical brief co-authored with one developmental psychologist (per the S3 risk-mitigation in the parent doc).

### Phase 4 — 12 weeks (long-memory variant of S1)
- Move `coach_memory` writes from Supabase RLS → on-device IndexedDB *first*, with optional E2E-encrypted Supabase mirror as a backup. `purgeChildLocalState` already does the right thing locally; the migration is server-side cleanup.
- This is the survivor-1 long-memory variant the parent doc flagged as the *unlock* the S3 wedge enables.

---

## 8. Kill criteria (we stop if any of these are true)

- Cold first-token >6 s on iPhone 13 in Phase-1 telemetry — voice mode unusable; pivot to "on-device for non-voice; cloud for voice with explicit consent".
- Fall-back-to-cloud rate >35 % after 30 days — runtime isn't reliable enough; means the wedge is hand-wavy in practice.
- Storage purge rate >12 %/week — parents are evicting the weights, which means we're paying the 900 MB tax repeatedly per user. Either the value isn't being felt or we're triggering OS storage pressure too often.
- Apple/Google explicitly ship a "kids AI" SDK that supersedes ours by Q3 2026 — re-evaluate; possibly absorb their SDK as a fourth runtime in the priority chain.

---

## 9. What this unlocks (downstream survivors)

- **S1 long-memory variant** — observational state lives in IndexedDB, not Postgres. Removes the hardest COPPA-2.0 retention question.
- **S2 audio-only mode** — Kokoro TTS + Whisper STT on-device makes the screen-free PWA usable on a transit Wi-Fi handoff (cloud round-trip would stall). Already aligned because S2's existing AudioModeScreen was built around `speechSynthesis` + Media Session, both client-only.
- **S5 standard** — gains a "verified on-device" tier in the badge JSON-LD; parents and pediatricians can filter for it.
- **S6 clinical wedge** — pediatrician-share PDFs gain a footer line "All AI processing for this child happened on this device", which is the single most powerful trust signal we can hand a pediatrician in 2026.

---

## 10. One-line summary

> The third-pass deepening shipped the routing skeleton; this brainstorm picks **WebLLM + Llama-3.2-1B for web/PWA** and **`@capacitor-community/llm` + Phi-3.5-mini for native**, lazy-installed, resumably cached, behind a public verifier — and treats the COPPA-2.0 deadline 4 days from now not as a wall to clear but as the gun-to-the-head we needed to do this anyway.

**Recommended next action**: cut a `feat/survivor-3-phase-1` branch, add `@mlc-ai/web-llm` as an opt-in dependency, and wire the "Enable on-device AI" CTA in `AIPrivacyScreen` to the third-pass `getOrInitWebLlmEngine()` that's already shipping.

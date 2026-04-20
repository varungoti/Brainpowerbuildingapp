# In-App Animation Plan (Consumer App)

> Goal: bring the cinematic feel of the marketing site (Anime.js + GSAP +
> Motion + react-spring) into the consumer app **without bloating the bundle,
> hurting battery on mid-range Android, or violating `prefers-reduced-motion`.**

---

## 1. Library budget

| Library | Where | Bundle impact | Why |
| --- | --- | --- | --- |
| `motion/react` (already used) | All micro-interactions | gzip ~25 KB (already shipped) | Keep as primary engine — declarative, React-friendly, springs built-in |
| `@react-spring/web` | Brain-map + Radar chart only | ~12 KB lazy-loaded | Best-in-class spring physics for free-form SVG morphing |
| `animejs` v4 | Lazy-loaded **per-screen** for 4 screens (Brain map, Radar, Quest reward, Voice idle bloom) | ~8 KB ESM | Stagger timing engine that motion lacks |
| `gsap` + `ScrollTrigger` | Lazy-loaded **only** for `BlueprintDocsScreen` | ~30 KB (off main path) | Long-form scroll-pin docs |
| CSS keyframes / `@property` | Everything else | 0 KB | First choice for ambient bloom, gradient sweeps, focus pulses |

**Hard rule:** total animation JS on the critical path stays <40 KB gzip. Anything heavier ships under `React.lazy()` for a single screen.

---

## 2. Motion principles (so the app feels coherent, not noisy)

1. **Quiet by default.** No looping animation outside the active screen.
2. **Springs > tweens.** Motion should feel physical. Use
   `transition: { type: "spring", stiffness: 220, damping: 26 }` as the
   default Motion config; keep tween durations to 180–280 ms when used.
3. **Delight where it matters: streaks, completions, reveals.** Skip
   animation on settings, paywall confirmation, error states.
4. **Respect `prefers-reduced-motion`.** Every animated component checks
   `useReducedMotion()` from `motion/react` and falls back to a static state
   with no decorative movement (brand still feels playful via gradients +
   typography).
5. **60 fps on 2020-era Android.** No animations that mutate `width`,
   `height`, `top`, or `left`. Only `transform`, `opacity`, `filter`.
6. **Battery > delight.** Use `IntersectionObserver` to pause loops when the
   element is offscreen. Use `visibilitychange` to pause loops when the tab
   is hidden.

---

## 3. Surface-by-surface plan

### 3.1 LandingScreen

- **Spark orb** — port the marketing `HeroOrb` to the app (Anime.js v4 stagger).
- **Headline reveal** — Motion stagger on word-by-word, 28 ms gap.
- **CTA breathing** — CSS-only `box-shadow` pulse at 0.05 alpha, 3 s loop.

### 3.2 OnboardingScreen

- **Step transitions** — Motion `LayoutGroup` + shared layout id between
  step illustrations (already implicit; codify it). 240 ms spring.
- **Illustration entrance** — react-spring trail on the 3 SVG shapes per
  step. Pauses immediately if `prefers-reduced-motion`.

### 3.3 HomeScreen

- **"Today's routine" cards** — Motion fade-up, 60 ms stagger, cap at 6 cards.
- **Streak chip pop** — Motion spring scale 1 → 1.08 → 1, only on increment.
- **Pull-to-refresh** — Motion drag with rubberband; visual feedback only.

### 3.4 ActivityDetailScreen

- **Brain region badge entrance** — react-spring trail on the regions
  involved; each badge slides in from the brain map illustration position.
- **Why-this-matters AI-age block** — Motion fade-up on first scroll.
- **Complete CTA reward** — Anime.js v4 confetti burst (lazy-loaded, 8 KB).

### 3.5 BrainMapScreen *(✨ flagship animation)*

- **Region hover** — react-spring opacity tween on per-region SVG path.
- **Coverage radar** — react-spring `useSprings` + Anime.js stagger on path
  morph between weeks (when user toggles "this week / last 4 weeks").
- **Initial reveal** — Anime.js sequential `strokeDashoffset` draw (~900ms).

### 3.6 QuestsScreen + StreaksWidget

- **Tier-up burst** — Anime.js confetti + Motion shake on the medal SVG.
- **Quest-card check-off** — Motion checkmark with `pathLength` 0 → 1.

### 3.7 PaywallScreen

- **Plan-card hover** — CSS-only gradient sweep (no JS).
- **Selected glow** — Motion springy `boxShadow` change.
- **Successful checkout** — react-spring confetti for 1.4 s, then Motion
  fade-up on the "you're in" copy. **No looping animation after this.**

### 3.8 AICounselorScreen + ConversationButton

- **Mic idle bloom** — CSS `@property --bloom` + animated radial gradient.
- **Listening state** — Motion `scale: [1, 1.06, 1]` infinite, paused when
  `voiceState !== "listen"`.
- **Thinking state** — Motion three-dot bounce, springy.
- **Speaking state** — react-spring waveform bars (8 bars) reacting to
  audio level RMS sampled at 60 fps.

### 3.9 ReportScreen (Weekly Intelligence Report)

- **Page transitions** — Motion `LayoutGroup` cross-fade.
- **Chart entrance** — Motion `pathLength` 0 → 1 stagger (Recharts SVG).

### 3.10 BlueprintDocsScreen

- **Scroll pin sections** — GSAP ScrollTrigger lazy-loaded only here.
- **Heading underline draw** — Anime.js sequential.

---

## 4. Reusable hooks (ship these first)

```ts
// src/utils/motion/useReveal.ts
export function useReveal(opts?: { delay?: number; y?: number }) {
  const reduce = useReducedMotion();
  return reduce
    ? { initial: false, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: opts?.y ?? 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-10% 0px" },
        transition: { type: "spring", stiffness: 220, damping: 28, delay: opts?.delay ?? 0 },
      };
}

// src/utils/motion/useStagger.ts
export function useStagger(count: number, gap = 0.06) {
  const reduce = useReducedMotion();
  return Array.from({ length: count }, (_, i) =>
    reduce ? {} : { transition: { delay: i * gap } },
  );
}

// src/utils/motion/lazyAnimejs.ts
export const lazyAnime = () => import("animejs").then((m) => (m as any).default ?? m);

// src/utils/motion/lazyGsap.ts
export async function lazyGsap() {
  const [{ default: gsap }, ST] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  gsap.registerPlugin(ST.ScrollTrigger);
  return gsap;
}
```

---

## 5. Implementation phases

| Phase | Scope | Effort | Owner |
| --- | --- | --- | --- |
| 1 | Add `useReveal`, `useStagger`, lazy loaders | 0.5 d | shared |
| 2 | Apply to Home, Activity Detail, Onboarding | 1 d | UI eng |
| 3 | Voice screens — bloom + waveform + thinking dots | 1 d | UI eng |
| 4 | BrainMap radar + region hover (react-spring + Anime.js) | 1.5 d | UI eng + design |
| 5 | Quests / Paywall confetti | 0.5 d | UI eng |
| 6 | Blueprint docs scroll-pin (GSAP, lazy) | 0.5 d | UI eng |
| 7 | Perf budget verification on 2020-era Pixel + iPhone SE | 0.5 d | QA |

Total: ~5 dev days end-to-end.

---

## 6. Telemetry & guardrails

- Add a one-time `voice_settings_change` style event:
  `animations_intensity_change` with `intensity ∈ { full, reduced, off }`.
- Surface a Profile → Display → "Animation intensity" toggle (3-way).
- If `navigator.deviceMemory < 4` OR `navigator.hardwareConcurrency < 4`,
  default to "reduced".
- Sentry Performance: track FPS in `BrainMapScreen` + `AICounselorScreen`;
  alert if median < 50 fps for >10% of sessions.

---

## 7. References

- Anime.js v4 docs (stagger + path morphing): https://animejs.com
- GSAP ScrollTrigger best practices: https://gsap.com/scrolltrigger
- Motion (Framer) physics defaults: https://motion.dev
- react-spring `useSprings` for parallel coordinated motion: https://www.react-spring.dev
- Velocity.js is unmaintained as of 2026 — replaced everywhere by Motion One in our marketing site.

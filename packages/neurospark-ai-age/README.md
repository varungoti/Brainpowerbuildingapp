# `@neurospark/ai-age` — Open AI-Age Competency Standard

> A free, MIT-licensed measurement standard for **AI-age developmental competencies** in children 0–12. Twelve evidence-grounded dimensions with peer-reviewed citations and a reference scoring function.

The aim is to give pediatricians, schools, edtech apps, and researchers a **shared rubric** for "what should a child have ample practice with so that — by the time they are an autonomous adult in 2036 — they can think *with* AI, not get steamrolled by it?"

This standard is published by the team behind [NeuroSpark](https://neurospark.app), but the spec is **vendor-neutral**. Khanmigo, Lovevery, Synthesis, Roblox Education, Tonies, daycares, and pediatric clinics are all welcome to score against it. The spec lives in `src/spec.json`; the reference scorer lives in `src/score.ts`.

## Why a standard?

OECD, EC + Code.org, MIT RAISE, and UNESCO each have overlapping-but-incompatible frameworks for "AI literacy" or "21st-century skills". McKinsey MGI (Nov 2025) clocks AI-fluency demand growing 7× in two years — the biggest demand spike on record — yet **no consensus rubric exists for under-10s**. Without a measurable, citable, kid-appropriate standard, every product invents its own and parents can't compare.

We chose twelve dimensions deliberately:
1. **Foundational** — `executive-function`, `metacognitive-self-direction`, `long-horizon-agency`, `embodied-mastery`
2. **Knowledge mechanics** — `deep-knowledge-retrieval`, `guided-curiosity`
3. **AI-era specifics** — `ai-literacy-cocreation`, `lateral-source-evaluation`, `creative-generation`
4. **Human moats** — `social-attunement`, `emotional-resilience`, `ethical-judgment`

Every dimension cites primary research. We deliberately **omit** dimensions that the literature has invalidated (generic growth-mindset boosters, "learning styles", brain-training transfer claims).

## Install

```bash
npm install @neurospark/ai-age
# or
pnpm add @neurospark/ai-age
```

## Usage

```ts
import { AI_AGE_COMPETENCIES, scoreInteraction } from "@neurospark/ai-age";

// 1. List the spec
console.log(AI_AGE_COMPETENCIES.map((c) => c.id));
// → ["executive-function", "metacognitive-self-direction", …]

// 2. Score an interaction transcript (any third party can do this)
const delta = scoreInteraction({
  ageMonths: 54,
  durationSec: 240,
  modality: "voice",
  transcript: [
    { from: "child", text: "I want to make a bigger tower" },
    { from: "adult", text: "What do you think will hold the weight better, the round block or the square one?" },
    { from: "child", text: "I think square because it's flat. Let me try." },
  ],
  observed: ["self-correction", "predicting", "spatial-reasoning"],
});

// → { "executive-function": 1.2, "metacognitive-self-direction": 0.8, "embodied-mastery": 0.4, … }
```

## Verifier badge

Embed the public `<NeuroSparkVerified />` web component on a partner product to show the user that the experience has been independently scored against this standard:

```html
<script src="https://standard.neurospark.app/badge.js" defer></script>
<neurospark-verified
  product="my-edtech-app"
  competencies="executive-function,creative-generation,emotional-resilience"
></neurospark-verified>
```

The badge fetches the latest scoring report from `https://standard.neurospark.app/api/verify/<product>` and renders a click-through to the public report. Self-attested ratings render in amber; independently-audited ratings render in green.

## Open governance

The spec is versioned semver. Breaking changes require a 90-day comment window. A multi-stakeholder governance committee will form in 2027 (target: ≥1 academic developmental psychologist, ≥2 unaffiliated edtech vendors, ≥1 pediatrician, ≥1 parent).

## Citations

See each competency's `evidence[]` array in `src/spec.json`. Every claim links to a peer-reviewed source. New dimensions require ≥2 peer-reviewed citations and clearance from the academic advisor.

## License

MIT — use it, fork it, embed it, ship it. The spec is free; only the *measurement-as-a-service* product (continuous longitudinal scoring against a real child cohort) is offered commercially by NeuroSpark.

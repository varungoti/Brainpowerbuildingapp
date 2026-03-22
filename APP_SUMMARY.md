# NeuroSpark / Brain Power Building App — Summary

**Version:** 2.0 Premium · March 2026  
**Tech Stack:** React 18, Vite 6, Tailwind CSS 4, Motion (Framer Motion), Radix UI, Supabase (optional)

---

## 1. App Overview

NeuroSpark is a **parent-facing brain development app** for children ages 1–10. It delivers 3–5 daily, offline activities built on neuroscience-backed techniques from Indian, Chinese, Japanese, Korean, and Western traditions. The app is designed for parents to facilitate real-world activities (no screen time for the child).

### Core Promise
> "Every day, 3–5 simple activities. Zero cost. Rooted in child development science. Ready in 60 seconds."

### Key Differentiators
- **13 Intelligence Types** (Howard Gardner + extensions)
- **7 Age Tiers** (Seedling → Achiever) with tailored content
- **AGE Algorithm** — daily activity generation engine balancing intelligences, materials, and cultural diversity
- **Zero-cost materials** — activities use common household items
- **Parent-facilitated** — app is for parents, activities happen offline

---

## 2. Architecture

### Screens & Flow

| Screen | Purpose |
|--------|---------|
| Landing | Intro, sign up / login |
| Auth | Email-based auth (local) |
| Onboarding | Child profile, materials, time budget |
| Home | Dashboard, today’s activities, year plan, credits |
| Generator | Configure pack (mood, time, materials) → generate → complete with ratings |
| Brain Map | 15-region neural map, radar chart, Year Plan, Know Your Child |
| History | Activity journey / Brain Journey |
| Stats | Development stats, badges |
| Profile | Settings, child profiles, logout |
| Paywall | Unlock daily packs (credits) |
| Year Plan | 300-activity roadmap |
| AI Counselor | Behavioral / eating / learning support |
| Milestones | Developmental milestones tracker |

### State & Data

- **AppContext** (`AppContext.tsx`): central state
- **Persistence**: `localStorage` under `neurospark_v2`
- **Stored data**: user, children, activity logs, material inventory, credits, KYC data

### Key Modules

- **activities.ts**: activity database + AGE algorithm (`runAGE`)
- **yearPlan.ts**: 300-activity year roadmap
- **milestones.ts**: developmental milestones
- **audioEffects.ts**: sound effects for UI feedback

---

## 3. Features

### Activity Generation (AGE Algorithm)

- Age tier (1–7) from child DOB
- Materials filter (paper, rice, cups, etc.)
- Mood (focus, calm, high, low)
- Time budget (15–90 min)
- Anti-repetition via recent activity IDs
- Intelligence coverage rules (≥4 types, left/right hemisphere balance, physical activity)

### Brain Map

- **AnatomicalBrain**: interactive SVG brain with 15 regions
- Regions: Executive Function, Linguistic, Creative, Logical-Mathematical, Spatial-Visual, Emotional, Musical-Rhythmic, Interpersonal, Bodily-Kinesthetic, Intrapersonal, Naturalist, Existential, Digital-Technological, Pronunciation, Coordination
- Scores from completed activities
- Neural connection lines, tooltips, detail panel

### Gamification

- Brain Points (BP)
- Levels: Seedling → Master Grower
- Streaks, badges
- Intelligence scores per region

---

## 4. File Structure (Key Paths)

```
src/
├── app/
│   ├── App.tsx              # Shell, routing, nav
│   ├── context/AppContext.tsx
│   ├── screens/             # All screen components
│   ├── components/
│   │   ├── AnatomicalBrain.tsx   # Brain region visualization
│   │   ├── ErrorBoundary.tsx
│   │   └── blueprint/       # Documentation sections
│   ├── data/
│   │   ├── activities.ts    # Activities + AGE engine
│   │   ├── yearPlan.ts
│   │   └── milestones.ts
│   └── utils/audioEffects.ts
├── styles/
│   ├── index.css
│   ├── tailwind.css
│   └── theme.css
└── main.tsx
```

---

## 5. Run Commands

```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (or: pnpm exec vite)
pnpm run build        # Production build (or: pnpm exec vite build)
```

---

## 6. Fixes Applied (March 2026)

### AnatomicalBrain.tsx

The component had severe corruption (OCR/encoding-style errors):

- Invalid tokens (e.g. `laral brain iage`, `] a cnst;`, `onst MAX_SCORE`)
- Malformed `BRAIN_REGIONS` (typos, missing `cx`/`cy`/`rx`/`ry`, invalid colors)
- Broken `CONNECTIONS` and `COVERS` arrays
- Corrupted JSX (e.g. `ry={isHighlighted ? "white" : region.ry}`)

**Changes:**

1. Rewrote `AnatomicalBrain.tsx` with valid syntax and structure
2. Aligned 15 regions with `BrainMapScreen` and activity intelligence keys
3. Replaced `figma:asset` brain image with a gradient background to avoid Figma-only dependency
4. Restored tooltips, detail panel, sparkles, and connection lines
5. Exported `ANATOMICAL_REGIONS` and `ANATOMICAL_MAX_SCORE` for compatibility

Build now completes successfully (`pnpm exec vite build`).

---

## 7. Related Documentation

- **BLUEPRINT.md**: Full research and design spec
- **README.md**: Basic run instructions
- **ATTRIBUTIONS.md**: Credits

---

*Last updated: March 2026*

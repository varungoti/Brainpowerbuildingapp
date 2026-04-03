# NeuroSpark Ultra Features Implementation Blueprint

> Production-ready specification for 18 modules that transform NeuroSpark into the
> world's most comprehensive child brain development platform.
>
> **Stack baseline:** React 18 + Vite 6 SPA, Capacitor 7 (Android/iOS), Supabase
> (Auth, Edge Functions via Hono, Realtime, Storage), localStorage persistence
> (`neurospark_v2`), Tailwind 4 + Radix UI + Motion, OpenAI (gpt-4o / gpt-4o-mini),
> Razorpay payments, Sentry monitoring.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Module 1 — AI Activity Adaptation Engine](#2-module-1--ai-activity-adaptation-engine)
3. [Module 2 — Weekly Intelligence Report (PDF)](#3-module-2--weekly-intelligence-report-pdf)
4. [Module 3 — Sibling Collaboration Mode](#4-module-3--sibling-collaboration-mode)
5. [Module 4 — Voice Instruction Mode](#5-module-4--voice-instruction-mode)
6. [Module 5 — 30-Language Support](#6-module-5--30-language-support)
7. [Module 6 — Creation Portfolio (Camera)](#7-module-6--creation-portfolio-camera)
8. [Module 7 — Parent Coaching Mode](#8-module-7--parent-coaching-mode)
9. [Module 8 — Seasonal Activity Library](#9-module-8--seasonal-activity-library)
10. [Module 9 — Sensory Modification Engine](#10-module-9--sensory-modification-engine)
11. [Module 10 — Community Activity Ratings](#11-module-10--community-activity-ratings)
12. [Module 11 — Developmental Milestone Predictor](#12-module-11--developmental-milestone-predictor)
13. [Module 12 — Sleep & Routine Optimizer](#13-module-12--sleep--routine-optimizer)
14. [Module 13 — Parent-Child Bonding Tracker](#14-module-13--parent-child-bonding-tracker)
15. [Module 14 — Gamified Achievement System](#15-module-14--gamified-achievement-system)
16. [Module 15 — Offline Activity Packs](#16-module-15--offline-activity-packs)
17. [Module 16 — Multi-Caregiver Mode](#17-module-16--multi-caregiver-mode)
18. [Module 17 — AI-Powered Progress Narratives](#18-module-17--ai-powered-progress-narratives)
19. [Module 18 — Smart Notification System](#19-module-18--smart-notification-system)
20. [TypeScript Type Definitions](#20-typescript-type-definitions)
21. [Edge Function API Contracts](#21-edge-function-api-contracts)
22. [SQL Migration Schemas](#22-sql-migration-schemas)
23. [Implementation Priority Matrix](#23-implementation-priority-matrix)
24. [Dependency Graph](#24-dependency-graph)
25. [Monetization Integration](#25-monetization-integration)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Vite SPA)                        │
│                                                                 │
│  AppContext (localStorage)   i18nContext   VoiceContext          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Adaptive  │ │ Report   │ │ Sensory  │ │ Offline Pack     │   │
│  │ ML Engine │ │ Builder  │ │ Adapter  │ │ Manager (IDB)    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Quest    │ │ Sibling  │ │ Routine  │ │ Portfolio        │   │
│  │ Engine   │ │ Matcher  │ │ Optimizer│ │ Store            │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│                                                                 │
│  ── Capacitor Bridge ──────────────────────────────────────────│
│  @capacitor/camera  @capacitor/local-notifications             │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS (Supabase Anon JWT)
┌─────────────────────▼───────────────────────────────────────────┐
│               SUPABASE EDGE FUNCTIONS (Hono)                    │
│                                                                 │
│  Existing:                    New:                              │
│  POST /ai-counselor           POST /ml/aggregate                │
│  POST /coach                  POST /report/email                │
│  POST /razorpay/*             POST /voice/synthesize            │
│  POST /rate-activity          POST /i18n/translate              │
│  GET  /activity-ratings       POST /narrative/generate          │
│  GET  /remote-config          POST /coach (activity-coaching)   │
│  POST /analytics/event                                          │
│                                                                 │
│  ── External APIs ─────────────────────────────────────────────│
│  OpenAI (gpt-4o)  Google Cloud TTS  Google Translate  Resend   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    SUPABASE POSTGRES                             │
│                                                                 │
│  Existing:                    New:                              │
│  feed_posts                   portfolio_entries                  │
│  feed_moderators              activity_ratings_agg              │
│                               caregiver_links                   │
│                               narrative_cache                   │
│  ── Storage Buckets ───────────────────────────────────────────│
│  portfolio-images             i18n-translations                 │
│  tts-cache                                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Shared Infrastructure Prerequisites

Before any module, these foundations must be built:

| # | Infrastructure               | Unblocks Modules      | Effort  |
|---|------------------------------|-----------------------|---------|
| 1 | i18n context + string extraction | 5, 4 (voice lang), 8 | 1 week  |
| 2 | Cloud sync for child data (Supabase) | 10, 16, 17       | 2 weeks |
| 3 | Capacitor plugin wiring (camera, notifications) | 6, 18 | 3 days  |
| 4 | `@react-pdf/renderer` integration | 2                  | 2 days  |
| 5 | `isPremium` real subscription flag | All gated features | 1 week  |

---

## 2. Module 1 — AI Activity Adaptation Engine

### Goal

On-device ML that adapts activity difficulty and selection based on rolling
engagement patterns. Privacy-first: no raw data ever leaves the device.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/ml/adaptiveEngine.ts` | New | Feature extraction, linear regression, recommendations |
| `src/lib/ml/federatedSync.ts` | New | Differential-privacy aggregation for v2 |
| `src/app/data/activities.ts` | Modify | Add `adaptiveBoost` scoring factor to `runAGE()` |
| `src/app/context/AppContext.tsx` | Modify | Persist `adaptiveModel`, call `retrain()` after log |

### Algorithm (v1 — no TF.js dependency)

```
For each brain region R:
  1. Collect last 14 days of ActivityLog entries where R in log.intelligences
  2. Extract features:
     - avgEngagement   = mean(engagementRating)        [1-5]
     - avgCompletion   = mean(completionTimeSeconds)    [seconds]
     - completionRate  = count(completed) / count(all)  [0-1]
     - currentTier     = mode(difficultyTier)           [1|2|3]
  3. Compute adaptiveScore = avgEngagement * completionRate * (1 / log(avgCompletion + 1))
  4. Recommended tier:
     - adaptiveScore > 0.7 AND completionRate > 0.8 → tier UP (min 3)
     - adaptiveScore < 0.3 OR completionRate < 0.4  → tier DOWN (max 1)
     - else                                          → stay current
  5. Confidence = min(1, sampleCount / 10)
```

### Integration with `runAGE()`

Inside the scoring loop in `activities.ts` (around line 993):

```typescript
// After existing scoring factors
const adaptive = adaptiveEngine.getRecommendations();
const regionRec = adaptive[activity.region];
if (regionRec) {
  if (activity.difficulty === regionRec.recommendedTier) {
    score += 15 * regionRec.confidenceScore;
  }
  if (regionRec.confidenceScore < 0.3) {
    score += 10; // exploration bonus for under-sampled regions
  }
}
```

### Federated Aggregation (v2)

- Client adds Laplacian noise (epsilon=1.0) to weight vectors before upload
- Edge function maintains running weighted average in KV
- Global weights available for optional calibration on cold-start users
- Zero PII: no user ID, no child data, only statistical weight deltas

---

## 3. Module 2 — Weekly Intelligence Report (PDF)

### Goal

Auto-generated, professional-grade PDF covering all 15 brain regions with trends,
activity history, AI insights, and recommendations. Shareable with educators and
pediatricians.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/reports/weeklyReportData.ts` | New | Aggregate 7-day data into report structure |
| `src/lib/reports/WeeklyReportPDF.tsx` | New | `@react-pdf/renderer` document component |
| `src/lib/reports/reportScheduler.ts` | New | Auto-detect when weekly report is due |
| `src/app/screens/ReportScreen.tsx` | New | Preview + download + share UI |
| `src/app/context/AppContext.tsx` | Modify | Add `reportHistory[]` to persisted state, add `report` to AppView |
| `supabase/functions/server/index.tsx` | Modify | Add `POST /report/email` endpoint |

### Report Data Structure

```typescript
interface WeeklyReportData {
  childName: string;
  childAge: number;
  ageTier: number;
  weekStart: string; // ISO date
  weekEnd: string;
  overallCoverage: number; // 0-100
  coverageDelta: number; // change from previous week
  totalActivitiesCompleted: number;
  totalBPEarned: number;
  streakDays: number;
  regions: Array<{
    id: string;
    name: string;
    emoji: string;
    color: string;
    currentScore: number;
    maxScore: number;
    weekDelta: number; // +/- change
    activityCount: number;
    avgEngagement: number;
    trend: "up" | "down" | "stable";
  }>;
  topStrengths: Array<{ regionName: string; insight: string }>;
  improvements: Array<{ regionName: string; suggestion: string }>;
  activityLog: Array<{
    date: string;
    activities: Array<{ name: string; emoji: string; engagement: number; completed: boolean }>;
  }>;
  aiNarrative?: string; // from Module 17 if available
}
```

### PDF Layout (6 pages)

1. **Cover:** Child name, date range, overall coverage ring, app branding
2. **15-Region Radar:** SVG radar chart rendered via react-pdf primitives + score table
3. **Region Detail:** Per-region bars with trend arrows, engagement sparklines
4. **Activity Log:** Day-by-day log with completion status and engagement stars
5. **AI Insights:** Strength and improvement narratives
6. **Recommendations:** Coming week focus areas + suggested activities

### Sharing

```typescript
async function shareReport(blob: Blob, childName: string) {
  const file = new File([blob], `${childName}-brain-report-${weekId}.pdf`, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: `${childName}'s Weekly Brain Report` });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  }
}
```

---

## 4. Module 3 — Sibling Collaboration Mode

### Goal

Activities designed for 2+ children at different ages, building interpersonal
intelligence together with role-based adaptations.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/sibling/siblingMatcher.ts` | New | Match activities to sibling groups |
| `src/app/screens/SiblingModeScreen.tsx` | New | Multi-child selector + collaborative pack |
| `src/app/data/activities.ts` | Modify | Add `collaborationType`, `siblingRoles` fields; `runAGE()` multi-child overload |
| `src/app/context/AppContext.tsx` | Modify | Add `siblingGroups[]`, extend `logActivity()` for multi-child |

### Role Assignment Algorithm

```
Given children sorted by age (oldest first):
  if ageDiff >= 3 years → "mentor-mentee"
    older: leads, demonstrates, explains
    younger: follows, mirrors, experiments
  if ageDiff 1-2 years → "cooperative"
    both: equal roles, shared objectives
  if ageDiff < 1 year → "parallel"
    both: same activity, separate stations, shared celebration
```

### Scoring in `runAGE()`

```typescript
function runAGEMultiChild(profiles: ChildProfile[], ...rest) {
  const allTiers = new Set(profiles.map(p => p.ageTier));
  const weakRegions = profiles.flatMap(p =>
    BRAIN_REGIONS.filter(r => (p.intelligenceScores[r.key] ?? 0) < 5).map(r => r.key)
  );
  const weakOverlap = weakRegions.filter((r, i, a) => a.indexOf(r) !== i); // shared weak regions

  return ACTIVITIES
    .filter(a => a.collaborationType !== "solo")
    .filter(a => allTiers.isSubsetOf(new Set(a.ageTiers)) || a.ageTiers.some(t => allTiers.has(t)))
    .map(a => ({
      ...a,
      score: baseScore(a) + (weakOverlap.some(w => a.intelligences.includes(w)) ? 25 : 0)
    }))
    .sort((a, b) => b.score - a.score);
}
```

### BP Multiplier

- Teamwork bonus: 1.2x BP for all children
- Interpersonal intelligence auto-increment: +1 per sibling session

---

## 5. Module 4 — Voice Instruction Mode

### Goal

Hands-free, audio-guided activity narration using Web Speech API (free, offline)
with premium Google Cloud TTS voices.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/voice/voiceNarrator.ts` | New | TTS engine with queue, controls, language support |
| `src/lib/voice/voicePromptBuilder.ts` | New | Converts activity data to narration-friendly text |
| `src/components/voice/VoicePlayerBar.tsx` | New | Floating playback UI |
| `src/app/screens/ActivityDetailScreen.tsx` | Modify | Add "Voice Mode" button, highlight synced steps |
| `src/app/screens/GeneratorScreen.tsx` | Modify | Add "Voice Mode" on activity cards |
| `supabase/functions/server/index.tsx` | Modify | Add `POST /voice/synthesize` for premium TTS |

### Narration Script Template

```
[INTRO]
"Hi! Let's do {activityName} with {childName}. This helps build their
{regionName} skills. You'll need: {materials.join(', ')}. Ready? Let's go!"

[STEP n]
"Step {n}: {instruction}"
[pause 3 seconds]
"Great job! Let's move on."

[ENCOURAGEMENT — every 3 steps]
"You're doing amazing! {childName} is building {intelligences[0]} right now."

[COMPLETION]
"Wonderful! You've finished {activityName}. {childName}'s {regionName}
neural connections are growing stronger. See you next time!"
```

### Wake Lock Integration

```typescript
let wakeLock: WakeSentinel | null = null;

async function acquireWakeLock() {
  if ("wakeLock" in navigator) {
    wakeLock = await navigator.wakeLock.request("screen");
  }
}

function releaseWakeLock() {
  wakeLock?.release();
  wakeLock = null;
}
```

---

## 6. Module 5 — 30-Language Support

### Goal

Full localization across 30 languages with a custom lightweight i18n system,
Google Translate API for initial translation, and human review caching.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/i18n/i18nContext.tsx` | New | React context: `locale`, `setLocale()`, `t()` |
| `src/lib/i18n/useT.ts` | New | Hook shorthand for translation |
| `locale/en.json` | New | Master English strings (namespaced) |
| `locale/{lang}.json` | New (30) | Translated strings per language |
| `scripts/extract-i18n.ts` | New | Build script to extract strings from TSX |
| `scripts/translate-all.ts` | New | CLI to batch-translate via Google API |
| `supabase/functions/server/index.tsx` | Modify | Add `POST /i18n/translate` endpoint |

### i18n Context Implementation

```typescript
interface I18nContextValue {
  locale: string;
  setLocale: (l: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  isLoading: boolean;
}

// t() with interpolation:
// t("greeting", { name: "Aria" }) → "Hello, Aria!"
// where en.json has: "greeting": "Hello, {{name}}!"

function t(key: string, params?: Record<string, string | number>): string {
  let str = translations[key] ?? fallbackEN[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
    }
  }
  return str;
}
```

### Supported Languages (30)

| Group | Languages |
|-------|-----------|
| Indian | Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, Urdu |
| East Asian | Mandarin (zh-CN), Japanese (ja), Korean (ko) |
| European | Spanish, French, Portuguese, German, Italian, Dutch, Russian, Polish |
| Middle East / Africa | Arabic (RTL), Turkish, Swahili, Persian (RTL) |
| Southeast Asian | Thai, Vietnamese, Indonesian, Malay |

### String Namespacing Convention

```json
{
  "home.greeting": "Good morning",
  "home.streakLabel": "Day streak",
  "brain.coverage": "Neural Coverage",
  "activity.step": "Step {{n}}",
  "coach.askButton": "Ask AI Coach",
  "report.download": "Download PDF"
}
```

---

## 7. Module 6 — Creation Portfolio (Camera)

### Goal

Camera capture of children's creations, auto-tagged with intelligence type and
developmental stage, with a gallery and report integration.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/portfolio/portfolioStore.ts` | New | CRUD for portfolio entries, image compression |
| `src/lib/portfolio/autoTagger.ts` | New | Auto-tag from activity + child age |
| `src/app/screens/PortfolioScreen.tsx` | New | Gallery with filters, timeline, sharing |
| `src/components/portfolio/CaptureButton.tsx` | New | Camera FAB on activity completion |
| `src/app/context/AppContext.tsx` | Modify | Add `portfolioEntries[]` to persisted state |
| `supabase/migrations/00004_portfolio.sql` | New | Cloud sync table + storage bucket |

### Image Compression Pipeline

```typescript
async function compressImage(file: File, maxSizeKB = 500): Promise<string> {
  const img = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const maxDim = 1200;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.3) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}
```

### Auto-Tagging Logic

```typescript
function autoTag(activityId: string, childAge: number, scores: Record<string, number>) {
  const activity = ACTIVITIES.find(a => a.id === activityId);
  const intelligences = activity?.intelligences ?? [];
  const stage = childAge < 2 ? "sensorimotor"
    : childAge < 4 ? "preoperational"
    : childAge < 7 ? "concrete-operational"
    : "formal-operational";

  const strengthRegions = BRAIN_REGIONS
    .filter(r => intelligences.includes(r.key) && (scores[r.key] ?? 0) > 10)
    .map(r => r.name);

  return { intelligences, stage, strengthRegions, suggestedTags: [...intelligences, stage] };
}
```

---

## 8. Module 7 — Parent Coaching Mode

### Goal

"How to interact" guidance for every activity with before/during/after phases,
language examples, and AI-powered contextual coaching.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/coaching/parentCoachingEngine.ts` | New | Static + AI coaching data |
| `src/components/coaching/CoachingOverlay.tsx` | New | Three-phase slide-up panel |
| `src/components/coaching/InteractionTimer.tsx` | New | Timer with coaching prompts |
| `src/app/screens/ActivityDetailScreen.tsx` | Modify | Add coaching tab |
| `supabase/functions/server/index.tsx` | Modify | Extend `/coach` with `type: "activity-coaching"` |

### Coaching Data Structure per Activity

```typescript
interface ParentCoaching {
  beforeTips: string[];       // "Gather materials at eye level"
  duringPrompts: string[];    // "Ask: what do you think will happen?"
  afterReflection: string[];  // "Talk about what was fun and what was hard"
  commonMistakes: string[];   // "Avoid correcting technique — focus on effort"
  deepeningStrategies: string[]; // "Try it with eyes closed for sensory challenge"
  languageExamples: Array<{
    situation: string;  // "Child gets frustrated"
    say: string;        // "This is tricky! Let's try a different way."
    avoid: string;      // "Don't say 'it's easy' — invalidates their feeling"
  }>;
  interactionStyle: "guided-discovery" | "scaffolded" | "free-play" | "structured";
  promptIntervalMinutes: number; // how often to show "pause and ask" during activity
}
```

### AI Coaching Request

```typescript
// Extend existing POST /coach endpoint
interface ActivityCoachingRequest {
  type: "activity-coaching";
  activityId: string;
  activityName: string;
  intelligences: string[];
  childProfile: { age: number; name: string; learningStyle?: string };
  kycData?: { patience: number; energy: number; sensitivity: number };
  phase: "before" | "during" | "after";
}
```

---

## 9. Module 8 — Seasonal Activity Library

### Goal

Season-aware and culture-aware activity recommendations grounded in local
calendars, weather patterns, and cultural celebrations.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/app/data/seasonalActivities.ts` | New | Seasonal catalogs, celebration mappings |
| `src/lib/seasonal/seasonDetector.ts` | New | Detect season from timezone/locale |
| `src/components/seasonal/SeasonalBanner.tsx` | New | Home screen seasonal banner |
| `src/app/data/activities.ts` | Modify | Add seasonal metadata to activities; `runAGE()` seasonal boost |

### Season Detection

```typescript
interface SeasonInfo {
  name: string;        // "Monsoon", "Summer", "Autumn"
  hemisphere: "north" | "south" | "tropical";
  region: string;      // "india", "europe", "sea"
  months: number[];    // [6, 7, 8, 9]
  celebrations: Celebration[];
}

interface Celebration {
  name: string;        // "Diwali"
  date: string;        // "2026-10-20" or "variable"
  brainRegions: string[]; // ["Creative", "Interpersonal"]
  activityIds: string[];
  description: string;
}

function detectSeason(timezone: string, locale: string): SeasonInfo {
  const offset = getTimezoneOffset(timezone);
  const month = new Date().getMonth() + 1;

  if (locale.startsWith("en-IN") || offset === 330) {
    // Indian seasons (6-season model)
    if ([3, 4].includes(month)) return SEASONS.india.spring;
    if ([5, 6].includes(month)) return SEASONS.india.summer;
    if ([7, 8, 9].includes(month)) return SEASONS.india.monsoon;
    if ([10, 11].includes(month)) return SEASONS.india.autumn;
    if ([12, 1].includes(month)) return SEASONS.india.winter;
    return SEASONS.india.preSummer;
  }
  // ... hemisphere detection for other regions
}
```

### Cultural Celebration Mapping (50+)

| Celebration | Region | Brain Regions Targeted |
|-------------|--------|----------------------|
| Diwali | India | Creative, Spatial-Visual, Interpersonal |
| Holi | India | Bodily-Kinesthetic, Spatial-Visual, Emotional |
| Pongal | South India | Naturalist, Interpersonal, Musical-Rhythmic |
| Chinese New Year | East Asia | Creative, Interpersonal, Musical-Rhythmic |
| Cherry Blossom | Japan | Naturalist, Intrapersonal, Creative |
| Harvest Festival | Global | Naturalist, Bodily-Kinesthetic, Logical-Mathematical |
| Ramadan | Middle East | Intrapersonal, Existential, Interpersonal |
| Christmas | Global | Creative, Interpersonal, Musical-Rhythmic |

---

## 10. Module 9 — Sensory Modification Engine

### Goal

One-tap activity adaptation for sensory sensitivities, ADHD, autism spectrum,
visual/hearing impairments, and fine motor delays.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/sensory/sensoryAdapter.ts` | New | Rules engine for activity modification |
| `src/lib/sensory/sensoryProfiles.ts` | New | Research-backed modification rules |
| `src/components/sensory/SensoryBadge.tsx` | New | Sensory load indicator on cards |
| `src/components/sensory/ModificationPanel.tsx` | New | Original vs modified comparison |
| `src/app/screens/OnboardingScreen.tsx` | Modify | Add optional sensory profile step |
| `src/app/data/activities.ts` | Modify | `runAGE()` sensory filtering |
| `src/app/screens/ActivityDetailScreen.tsx` | Modify | Show modified steps |

### Modification Rules Engine

```typescript
type SensoryCondition =
  | "adhd"
  | "asd"
  | "visual-impairment"
  | "hearing-impairment"
  | "sensory-processing"
  | "fine-motor-delay"
  | "anxiety";

interface ModificationRule {
  condition: SensoryCondition;
  trigger: string;         // e.g. "activity.duration > 10"
  modification: string;    // human-readable change
  apply: (activity: Activity) => Partial<Activity>;
  evidence: string;        // citation or research basis
}

const ADHD_RULES: ModificationRule[] = [
  {
    condition: "adhd",
    trigger: "step count > 5",
    modification: "Break into micro-steps of 2-3 instructions each",
    apply: (a) => ({
      instructions: chunkSteps(a.instructions, 3).flatMap((chunk, i) => [
        `--- Mini-round ${i + 1} ---`,
        ...chunk,
        "Take a 30-second movement break!",
      ]),
    }),
    evidence: "Barkley (2015): Chunked instructions improve task completion by 40% in ADHD children",
  },
  {
    condition: "adhd",
    trigger: "duration > 10",
    modification: "Cap at 8 minutes with movement break at midpoint",
    apply: (a) => ({
      duration: Math.min(a.duration, 8),
      instructions: insertAtMiddle(a.instructions, "Movement break: jump, stretch, or spin!"),
    }),
    evidence: "DuPaul & Stoner (2014): 8-minute activity ceiling optimal for ADHD age 3-7",
  },
];

const ASD_RULES: ModificationRule[] = [
  {
    condition: "asd",
    trigger: "always",
    modification: "Add visual schedule with numbered steps and completion checkmarks",
    apply: (a) => ({
      instructions: a.instructions.map((s, i) => `☐ Step ${i + 1}: ${s}`),
    }),
    evidence: "Mesibov & Shea (2010): Visual structure reduces anxiety by 60% in ASD",
  },
  {
    condition: "asd",
    trigger: "intelligences includes 'Interpersonal'",
    modification: "Reduce social demand — convert group steps to parallel play",
    apply: (a) => ({
      instructions: a.instructions.map(s =>
        s.replace(/together|with others|group/gi, "side-by-side (each with own materials)")
      ),
    }),
    evidence: "Wolfberg (2009): Parallel play scaffolding improves social tolerance in ASD",
  },
];
```

### Sensory Load Scoring

```typescript
function computeSensoryLoad(activity: Activity): { visual: number; auditory: number; tactile: number; social: number; motor: number; total: "low" | "medium" | "high" } {
  let visual = 0, auditory = 0, tactile = 0, social = 0, motor = 0;
  if (activity.materials.some(m => /color|paint|screen/i.test(m))) visual += 2;
  if (activity.intelligences.includes("Musical-Rhythmic")) auditory += 2;
  if (activity.intelligences.includes("Bodily-Kinesthetic")) tactile += 2;
  if (activity.intelligences.includes("Interpersonal")) social += 2;
  if (activity.difficulty >= 3) motor += 1;
  const sum = visual + auditory + tactile + social + motor;
  return { visual, auditory, tactile, social, motor, total: sum > 6 ? "high" : sum > 3 ? "medium" : "low" };
}
```

---

## 11. Module 10 — Community Activity Ratings

### Goal

Anonymous, privacy-preserving global ratings that feed back into the recommendation
engine for all families.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/community/communityScorer.ts` | New | Fetch, cache, and score community data |
| `src/components/community/CommunityBadge.tsx` | New | Rating + trending badge on cards |
| `supabase/migrations/00005_community_ratings.sql` | New | Aggregated ratings table |
| `supabase/functions/server/index.tsx` | Modify | Enhanced `POST /rate-activity` with batch flush |
| `src/app/data/activities.ts` | Modify | `communityBoost` in `runAGE()` |
| `src/app/screens/GeneratorScreen.tsx` | Modify | Show ratings on completion |

### Rating Flow

```
User completes activity → rates engagement (existing) → POST /rate-activity
  → KV: increment activity:{id}:tier:{tier}:{engagement|completion|difficulty}
  → Every 100 ratings OR 1 hour: flush to Postgres activity_ratings_agg
  → Client fetches GET /activity-ratings on app start (cached 24h in state)
  → runAGE() applies communityBoost: high-engagement = +12, low = -8
```

### Trending Detection

```typescript
function isTrending(activityId: string, ratings: CommunityRatings): boolean {
  const current = ratings.get(activityId);
  if (!current || current.totalRatings < 20) return false;
  const recentVelocity = current.last7DaysRatings / 7;
  const historicVelocity = current.totalRatings / current.ageDays;
  return recentVelocity > historicVelocity * 2.5;
}
```

---

## 12. Module 11 — Developmental Milestone Predictor

### Goal

AI-powered milestone trajectory analysis that predicts upcoming milestones and
identifies at-risk developmental areas before they become concerns.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/milestones/milestonePredictor.ts` | New | Trajectory analysis + prediction |
| `src/components/milestones/PredictorCard.tsx` | New | Home screen prediction card |
| `src/app/data/activities.ts` | Modify | `runAGE()` milestone prediction boost |

### Prediction Algorithm

```typescript
interface MilestonePrediction {
  milestoneId: string;
  title: string;
  expectedDate: string;     // ISO date
  confidencePercent: number; // 0-100
  status: "on-track" | "needs-attention" | "at-risk";
  recommendedActivities: string[]; // activity IDs
  requiredRegions: string[];
}

function predictMilestones(child: ChildProfile, logs: ActivityLog[], milestones: Milestone[]): MilestonePrediction[] {
  const ageMonths = monthsBetween(child.dob, new Date());
  const unchecked = milestones.filter(m => !child.milestoneChecks?.includes(m.id));

  return unchecked
    .filter(m => m.expectedAgeMonths >= ageMonths && m.expectedAgeMonths <= ageMonths + 8)
    .map(m => {
      const requiredRegions = m.brainRegions;
      const avgScore = requiredRegions.reduce((sum, r) =>
        sum + (child.intelligenceScores[r] ?? 0), 0) / requiredRegions.length;
      const velocity = computeScoreVelocity(logs, requiredRegions, 30); // score/month
      const monthsNeeded = (10 - avgScore) / Math.max(velocity, 0.5);
      const monthsUntilExpected = m.expectedAgeMonths - ageMonths;

      return {
        milestoneId: m.id,
        title: m.title,
        expectedDate: addMonths(new Date(), monthsUntilExpected).toISOString(),
        confidencePercent: Math.min(100, Math.round((velocity / 2) * 100)),
        status: monthsNeeded <= monthsUntilExpected * 0.8 ? "on-track"
          : monthsNeeded <= monthsUntilExpected * 1.2 ? "needs-attention"
          : "at-risk",
        recommendedActivities: findActivitiesForRegions(requiredRegions, child.ageTier),
        requiredRegions,
      };
    })
    .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());
}
```

---

## 13. Module 12 — Sleep & Routine Optimizer

### Goal

Map brain development activities to optimal times of day based on the child's
energy patterns, sleep schedule, and cognitive peaks.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/routine/routineOptimizer.ts` | New | Optimal window calculation |
| `src/components/routine/DailySchedule.tsx` | New | Visual timeline component |
| `src/app/screens/GeneratorScreen.tsx` | Modify | Time-of-day aware generation |
| `src/app/context/AppContext.tsx` | Modify | Add `routineConfig` to persisted state |

### Optimal Window Mapping

```typescript
interface RoutineConfig {
  wakeTime: string;        // "07:00"
  napStart?: string;       // "13:00"
  napEnd?: string;         // "14:30"
  bedTime: string;         // "20:00"
  energyPattern: "morning-peak" | "afternoon-peak" | "even" | "unknown";
}

interface ActivityWindow {
  label: string;           // "Morning Focus"
  start: string;           // "08:30"
  end: string;             // "10:00"
  bestRegions: string[];   // brain regions optimal for this window
  reason: string;          // "Cortisol peaks 30-60 min after wake..."
}

const REGION_TIME_MAP: Record<string, string[]> = {
  "morning-peak": ["Logical-Mathematical", "Linguistic", "Executive Function"],
  "mid-morning":  ["Creative", "Spatial-Visual", "Digital-Technological"],
  "post-nap":     ["Bodily-Kinesthetic", "Coordination", "Musical-Rhythmic"],
  "late-afternoon":["Interpersonal", "Emotional", "Intrapersonal"],
  "pre-bedtime":  ["Naturalist", "Existential", "Pronunciation"],
};
```

---

## 14. Module 13 — Parent-Child Bonding Tracker

### Goal

Track and visualize the quality of parent-child interaction, not just activity
completion metrics.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/bonding/bondingAnalytics.ts` | New | Bonding score calculation, trends |
| `src/app/screens/BondingScreen.tsx` | New | Bonding journey visualization |
| `src/app/context/AppContext.tsx` | Modify | Extend `ActivityLog`, add `bonding` to AppView |

### Bonding Score Formula

```typescript
function computeWeeklyBondingScore(logs: ActivityLog[]): number {
  if (logs.length === 0) return 0;

  const avgInteraction = mean(logs.map(l => l.interactionQuality ?? 3));   // 1-5
  const avgParticipation = mean(logs.map(l =>
    l.parentParticipation === "active" ? 5
    : l.parentParticipation === "guided" ? 3
    : 1
  ));
  const consistency = Math.min(1, logs.length / 5); // 5 activities/week = 100%
  const joyCount = logs.reduce((sum, l) => sum + (l.joyMoments?.length ?? 0), 0);
  const joyBonus = Math.min(1, joyCount / 3); // 3+ joy moments = full bonus

  // Weighted formula (max 100)
  return Math.round(
    avgInteraction * 8 +     // 40 max
    avgParticipation * 4 +   // 20 max
    consistency * 25 +        // 25 max
    joyBonus * 15             // 15 max
  );
}
```

---

## 15. Module 14 — Gamified Achievement System

### Goal

Deep gamification with daily quests, weekly challenges, monthly themes, streak
enhancements, and unlockable content.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/gamification/questEngine.ts` | New | Quest generation and tracking |
| `src/lib/gamification/streakSystem.ts` | New | Enhanced streak with freezes and recovery |
| `src/components/gamification/QuestBoard.tsx` | New | Card-based quest display |
| `src/app/context/AppContext.tsx` | Modify | Add `quests[]`, `streakFreezes`, `achievements[]` |

### Quest Types

```typescript
type QuestType = "daily" | "weekly" | "monthly" | "special";

interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  emoji: string;
  target: number;          // e.g. 3 activities
  progress: number;
  rewardBP: number;
  rewardBadge?: string;
  expiresAt: string;       // ISO date
  condition: QuestCondition;
}

type QuestCondition =
  | { type: "complete-n"; count: number }
  | { type: "region-n"; region: string; count: number }
  | { type: "streak-days"; days: number }
  | { type: "score-reach"; region: string; score: number }
  | { type: "engagement-avg"; min: number; activities: number };
```

### Streak Enhancement

```typescript
interface EnhancedStreak {
  currentDays: number;
  longestEver: number;
  freezesAvailable: number;  // earned 1 per 7-day streak, max 3
  freezesUsed: number;
  lastActivityDate: string;

  // Recovery: miss 1 day, complete 2 the next to maintain
  recoveryAvailable: boolean;
  recoveryDeadline?: string;
}
```

### Quest Generation (daily)

```typescript
function generateDailyQuests(child: ChildProfile, scores: Record<string, number>): Quest[] {
  const weakest = getWeakestRegions(scores, 2);
  const today = new Date().toISOString().split("T")[0];

  return [
    {
      id: `daily-${today}-1`,
      type: "daily",
      title: `Complete ${weakest[0].name} activity`,
      description: `Build your ${weakest[0].name} skills today`,
      emoji: weakest[0].emoji,
      target: 1, progress: 0, rewardBP: 15,
      expiresAt: endOfDay(today),
      condition: { type: "region-n", region: weakest[0].key, count: 1 },
    },
    {
      id: `daily-${today}-2`,
      type: "daily",
      title: "Complete any 2 activities",
      description: "Build neural connections across regions",
      emoji: "🧠",
      target: 2, progress: 0, rewardBP: 10,
      expiresAt: endOfDay(today),
      condition: { type: "complete-n", count: 2 },
    },
  ];
}
```

---

## 16. Module 15 — Offline Activity Packs

### Goal

Pre-generated activity packs cached in IndexedDB for fully offline operation
in areas with unreliable connectivity.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/offline/offlinePackManager.ts` | New | Pack generation, IDB caching, sync queue |
| `public/sw.js` | Modify | Cache offline pack assets |
| `src/app/context/AppContext.tsx` | Modify | Queue analytics for batch upload |

### IndexedDB Schema

```typescript
// Database: "neurospark-offline"
// Object stores:
//   "packs"    → { id, childId, generatedAt, expiresAt, activities: Activity[], coachingData: {} }
//   "syncQueue" → { id, type: "log"|"analytics"|"rating", payload, createdAt }

async function preGenerateWeekPack(child: ChildProfile): Promise<void> {
  const pack = runAGE(child.ageTier, /* ... 7 days of activities */);
  const coachingData = pack.map(a => getStaticCoachingData(a.id));
  const voiceScripts = pack.map(a => buildNarrationScript(a, child.name));

  await idb.put("packs", {
    id: `${child.id}-${weekId()}`,
    childId: child.id,
    generatedAt: new Date().toISOString(),
    expiresAt: addDays(new Date(), 7).toISOString(),
    activities: pack,
    coachingData,
    voiceScripts,
  });
}
```

### Background Sync

```typescript
// In service worker
self.addEventListener("sync", (event) => {
  if (event.tag === "neurospark-sync") {
    event.waitUntil(flushSyncQueue());
  }
});

async function flushSyncQueue() {
  const items = await idb.getAll("syncQueue");
  for (const item of items) {
    try {
      await fetch(`${EDGE_BASE}/${item.type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      await idb.delete("syncQueue", item.id);
    } catch {
      break; // still offline, stop
    }
  }
}
```

---

## 17. Module 16 — Multi-Caregiver Mode

### Goal

Multiple caregivers (parents, grandparents, nannies) can contribute to a single
child's development tracking with role-based access.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/caregiver/caregiverSync.ts` | New | Realtime sync, conflict resolution |
| `src/app/screens/CaregiversScreen.tsx` | New | Invite, manage roles, activity attribution |
| `supabase/migrations/00006_caregivers.sql` | New | Caregiver links table with RLS |
| `src/app/context/AppContext.tsx` | Modify | Add `caregivers` to AppView, add sync logic |

### Role Permissions

| Role | View Data | Log Activities | Edit Profile | Manage Caregivers | Delete Data |
|------|-----------|---------------|--------------|-------------------|-------------|
| Primary | Yes | Yes | Yes | Yes | Yes |
| Caregiver | Yes | Yes | No | No | No |
| Observer | Yes | No | No | No | No |

### Conflict Resolution

```
When two caregivers update concurrently:
  - ActivityLogs: MERGE (append both, deduplicate by id)
  - IntelligenceScores: LAST-WRITE-WINS (higher timestamp)
  - ChildProfile metadata: LAST-WRITE-WINS
  - MilestoneChecks: UNION (never un-check)
```

---

## 18. Module 17 — AI-Powered Progress Narratives

### Goal

Weekly AI-generated narrative summaries written like a thoughtful early childhood
educator's note.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/components/narrative/WeeklyNarrative.tsx` | New | Beautiful narrative card |
| `supabase/functions/server/index.tsx` | Modify | Add `POST /narrative/generate` |
| `supabase/migrations/00007_narrative_cache.sql` | New | KV-backed narrative cache |

### Prompt Template

```
You are a warm, insightful early childhood development educator writing a weekly
progress note for a parent.

Child: {name}, age {age} ({ageTier})
This week: {activityCount} activities completed, {bpEarned} brain points earned.
Streak: {streak} days.

Score changes this week:
{regionDeltas.map(r => `${r.name}: ${r.before} → ${r.after} (${r.trend})`)}

Milestones checked: {milestones.join(", ") || "none this week"}

Write exactly:
1. A warm opening paragraph about the child's engagement this week (2-3 sentences)
2. A specific insight paragraph highlighting their strongest growth area with
   concrete examples from the activities they did (3-4 sentences)
3. A forward-looking paragraph with 2 specific suggestions for next week (2-3 sentences)

Tone: warm, specific, encouraging but honest. Avoid generic praise.
Use the child's name naturally. Maximum 200 words total.
```

---

## 19. Module 18 — Smart Notification System

### Goal

Intelligent, non-intrusive notifications that learn from parent behavior and
remind at optimal times.

### File Map

| File | Type | Purpose |
|------|------|---------|
| `src/lib/notifications/smartScheduler.ts` | New | Learn patterns, schedule reminders |
| `src/lib/notifications/notificationChannel.ts` | New | Capacitor + Web API abstraction |
| `src/app/context/AppContext.tsx` | Modify | Add `notificationPrefs` to persisted state |

### Scheduling Algorithm

```typescript
interface UsagePattern {
  hourBuckets: number[];  // 24 elements: count of app opens per hour
  dayBuckets: number[];   // 7 elements: count per day of week
  avgSessionMinutes: number;
  lastActiveAt: string;
}

function getOptimalReminderTime(pattern: UsagePattern): string {
  // Find the hour with highest historical usage
  const peakHour = pattern.hourBuckets.indexOf(Math.max(...pattern.hourBuckets));
  // Remind 30 minutes before peak
  const reminderHour = peakHour === 0 ? 23 : peakHour - 1;
  const reminderMinute = 30;
  return `${String(reminderHour).padStart(2, "0")}:${reminderMinute}`;
}

type NotificationType =
  | "daily-reminder"       // No activity today, optimal time approaching
  | "streak-at-risk"       // Evening, streak will break tomorrow
  | "milestone-approaching" // Predicted milestone within 2 weeks
  | "report-ready"         // Weekly report generated
  | "quest-expiring";      // Daily quest expires in 2 hours
```

### Notification Frequency Rules

- Maximum 1 notification per day (user configurable)
- Never between 21:00 and 07:00 (user configurable quiet hours)
- Skip if user already opened app today
- Exponential backoff if notifications are dismissed 3+ times in a row

---

## 20. TypeScript Type Definitions

All new types to be added to the codebase, organized by module.

```typescript
// ═══════════════════════════════════════════════════════════════
// MODULE 1: AI Activity Adaptation
// ═══════════════════════════════════════════════════════════════

/** Extends existing ActivityLog in AppContext.tsx */
interface ActivityLogAdaptiveFields {
  difficultyTier: 1 | 2 | 3;
  completionTimeSeconds: number;
  attemptsBeforeComplete: number;
}

interface AdaptiveRegionRecommendation {
  recommendedTier: 1 | 2 | 3;
  confidenceScore: number;        // 0-1
  sampleCount: number;
  lastUpdated: string;            // ISO date
}

interface AdaptiveModel {
  regionWeights: Record<string, number>;
  recommendations: Record<string, AdaptiveRegionRecommendation>;
  lastTrainedAt: string;
  version: number;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 2: Weekly Report
// ═══════════════════════════════════════════════════════════════

interface WeeklyReportData {
  childName: string;
  childAge: number;
  ageTier: number;
  weekStart: string;
  weekEnd: string;
  overallCoverage: number;
  coverageDelta: number;
  totalActivitiesCompleted: number;
  totalBPEarned: number;
  streakDays: number;
  regions: RegionReportEntry[];
  topStrengths: Array<{ regionName: string; insight: string }>;
  improvements: Array<{ regionName: string; suggestion: string }>;
  activityLog: DailyActivitySummary[];
  aiNarrative?: string;
}

interface RegionReportEntry {
  id: string;
  name: string;
  emoji: string;
  color: string;
  currentScore: number;
  maxScore: number;
  weekDelta: number;
  activityCount: number;
  avgEngagement: number;
  trend: "up" | "down" | "stable";
}

interface DailyActivitySummary {
  date: string;
  activities: Array<{
    name: string;
    emoji: string;
    engagement: number;
    completed: boolean;
  }>;
}

interface ReportHistoryEntry {
  generatedAt: string;
  weekStart: string;
  weekEnd: string;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 3: Sibling Collaboration
// ═══════════════════════════════════════════════════════════════

interface SiblingGroup {
  id: string;
  childIds: string[];
  name: string;
  createdAt: string;
}

interface SiblingRole {
  ageRange: [number, number];
  role: "mentor" | "explorer" | "equal" | "parallel";
  adaptations: string;
}

interface CollaborationLog {
  logId: string;
  groupId: string;
  childIds: string[];
  activityId: string;
  completedAt: string;
}

/** Extends existing Activity type */
interface ActivityCollaborationFields {
  collaborationType: "solo" | "sibling" | "both";
  siblingRoles: SiblingRole[];
  interactionType: "cooperative" | "parallel" | "mentor-mentee";
}

// ═══════════════════════════════════════════════════════════════
// MODULE 4: Voice Instruction
// ═══════════════════════════════════════════════════════════════

interface VoiceNarratorState {
  isPlaying: boolean;
  currentStepIndex: number;
  totalSteps: number;
  rate: 0.8 | 1 | 1.2;
  locale: string;
  wakeLockActive: boolean;
}

interface NarrationScript {
  intro: string;
  steps: Array<{ text: string; pauseMs: number }>;
  encouragements: string[];
  completion: string;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 5: i18n
// ═══════════════════════════════════════════════════════════════

interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  isLoading: boolean;
}

type SupportedLocale =
  | "en" | "hi" | "ta" | "te" | "kn" | "ml" | "bn" | "mr" | "gu" | "pa" | "or" | "as" | "ur"
  | "zh-CN" | "ja" | "ko"
  | "es" | "fr" | "pt" | "de" | "it" | "nl" | "ru" | "pl"
  | "ar" | "tr" | "sw" | "fa"
  | "th" | "vi" | "id" | "ms";

// ═══════════════════════════════════════════════════════════════
// MODULE 6: Creation Portfolio
// ═══════════════════════════════════════════════════════════════

interface PortfolioEntry {
  id: string;
  childId: string;
  imageDataUrl: string;
  activityId?: string;
  intelligences: string[];
  tags: string[];
  caption: string;
  createdAt: string;
  stage: "sensorimotor" | "preoperational" | "concrete-operational" | "formal-operational";
  includeInReport: boolean;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 7: Parent Coaching
// ═══════════════════════════════════════════════════════════════

interface ParentCoaching {
  beforeTips: string[];
  duringPrompts: string[];
  afterReflection: string[];
  commonMistakes: string[];
  deepeningStrategies: string[];
  languageExamples: LanguageExample[];
  interactionStyle: "guided-discovery" | "scaffolded" | "free-play" | "structured";
  promptIntervalMinutes: number;
}

interface LanguageExample {
  situation: string;
  say: string;
  avoid: string;
}

interface ActivityCoachingRequest {
  type: "activity-coaching";
  activityId: string;
  activityName: string;
  intelligences: string[];
  childProfile: { age: number; name: string; learningStyle?: string };
  kycData?: { patience: number; energy: number; sensitivity: number };
  phase: "before" | "during" | "after";
}

// ═══════════════════════════════════════════════════════════════
// MODULE 8: Seasonal Activities
// ═══════════════════════════════════════════════════════════════

interface SeasonInfo {
  name: string;
  hemisphere: "north" | "south" | "tropical";
  region: string;
  months: number[];
  celebrations: Celebration[];
}

interface Celebration {
  name: string;
  date: string;
  brainRegions: string[];
  activityIds: string[];
  description: string;
  culturalContext: string;
}

interface SeasonalCalendar {
  region: string;
  seasons: SeasonInfo[];
}

// ═══════════════════════════════════════════════════════════════
// MODULE 9: Sensory Modification
// ═══════════════════════════════════════════════════════════════

type SensoryCondition =
  | "adhd"
  | "asd"
  | "visual-impairment"
  | "hearing-impairment"
  | "sensory-processing"
  | "fine-motor-delay"
  | "anxiety";

interface SensoryProfile {
  type: "neurotypical" | "sensory-seeking" | "sensory-avoiding" | "mixed";
  conditions: SensoryCondition[];
  modifications: string[];
}

interface SensoryLoad {
  visual: number;
  auditory: number;
  tactile: number;
  social: number;
  motor: number;
  total: "low" | "medium" | "high";
}

interface ModificationRule {
  condition: SensoryCondition;
  trigger: string;
  modification: string;
  apply: (activity: Activity) => Partial<Activity>;
  evidence: string;
}

/** Extends existing Activity type */
interface ActivitySensoryFields {
  sensoryModifications?: Record<SensoryCondition, {
    replacements: string[];
    adaptations: string[];
    warnings: string[];
  }>;
  sensoryLoad?: SensoryLoad;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 10: Community Ratings
// ═══════════════════════════════════════════════════════════════

interface CommunityRating {
  activityId: string;
  ageTier: number;
  engagementAvg: number;
  completionRate: number;
  totalRatings: number;
  difficultyFeedback: { tooEasy: number; right: number; tooHard: number };
  last7DaysRatings: number;
  ageDays: number;
  trending: boolean;
}

interface RatingSubmission {
  activityId: string;
  ageTier: number;
  engagement: 1 | 2 | 3 | 4 | 5;
  difficulty: "too-easy" | "right" | "too-hard";
  completed: boolean;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 11: Milestone Predictor
// ═══════════════════════════════════════════════════════════════

interface MilestonePrediction {
  milestoneId: string;
  title: string;
  expectedDate: string;
  confidencePercent: number;
  status: "on-track" | "needs-attention" | "at-risk";
  recommendedActivities: string[];
  requiredRegions: string[];
}

// ═══════════════════════════════════════════════════════════════
// MODULE 12: Routine Optimizer
// ═══════════════════════════════════════════════════════════════

interface RoutineConfig {
  wakeTime: string;
  napStart?: string;
  napEnd?: string;
  bedTime: string;
  energyPattern: "morning-peak" | "afternoon-peak" | "even" | "unknown";
}

interface ActivityWindow {
  label: string;
  start: string;
  end: string;
  bestRegions: string[];
  reason: string;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 13: Bonding Tracker
// ═══════════════════════════════════════════════════════════════

/** Extends existing ActivityLog */
interface ActivityLogBondingFields {
  interactionQuality: 1 | 2 | 3 | 4 | 5;
  parentParticipation: "active" | "guided" | "observed";
  joyMoments: string[];
}

interface WeeklyBondingScore {
  weekStart: string;
  score: number;          // 0-100
  trend: "improving" | "declining" | "stable";
  joyMoments: string[];
}

// ═══════════════════════════════════════════════════════════════
// MODULE 14: Gamification
// ═══════════════════════════════════════════════════════════════

type QuestType = "daily" | "weekly" | "monthly" | "special";

type QuestCondition =
  | { type: "complete-n"; count: number }
  | { type: "region-n"; region: string; count: number }
  | { type: "streak-days"; days: number }
  | { type: "score-reach"; region: string; score: number }
  | { type: "engagement-avg"; min: number; activities: number };

interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  emoji: string;
  target: number;
  progress: number;
  rewardBP: number;
  rewardBadge?: string;
  expiresAt: string;
  condition: QuestCondition;
}

interface EnhancedStreak {
  currentDays: number;
  longestEver: number;
  freezesAvailable: number;
  freezesUsed: number;
  lastActivityDate: string;
  recoveryAvailable: boolean;
  recoveryDeadline?: string;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 15: Offline Packs
// ═══════════════════════════════════════════════════════════════

interface OfflinePack {
  id: string;
  childId: string;
  generatedAt: string;
  expiresAt: string;
  activities: Activity[];
  coachingData: Record<string, ParentCoaching>;
  voiceScripts: NarrationScript[];
}

interface SyncQueueItem {
  id: string;
  type: "log" | "analytics" | "rating";
  payload: unknown;
  createdAt: string;
  retryCount: number;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 16: Multi-Caregiver
// ═══════════════════════════════════════════════════════════════

type CaregiverRole = "primary" | "caregiver" | "observer";

interface CaregiverLink {
  id: string;
  userId: string;
  childId: string;
  role: CaregiverRole;
  invitedBy: string;
  acceptedAt?: string;
  displayName: string;
  email: string;
}

// ═══════════════════════════════════════════════════════════════
// MODULE 17: Progress Narratives
// ═══════════════════════════════════════════════════════════════

interface ProgressNarrative {
  childId: string;
  weekStart: string;
  weekEnd: string;
  narrative: string;       // AI-generated text
  generatedAt: string;
  model: string;           // "gpt-4o"
}

// ═══════════════════════════════════════════════════════════════
// MODULE 18: Smart Notifications
// ═══════════════════════════════════════════════════════════════

type NotificationType =
  | "daily-reminder"
  | "streak-at-risk"
  | "milestone-approaching"
  | "report-ready"
  | "quest-expiring";

interface NotificationPrefs {
  enabled: boolean;
  maxPerDay: number;         // default 1
  quietStart: string;        // "21:00"
  quietEnd: string;          // "07:00"
  types: Record<NotificationType, boolean>;
}

interface UsagePattern {
  hourBuckets: number[];     // 24 elements
  dayBuckets: number[];      // 7 elements
  avgSessionMinutes: number;
  lastActiveAt: string;
}

// ═══════════════════════════════════════════════════════════════
// PERSISTED STATE EXTENSIONS
// ═══════════════════════════════════════════════════════════════

/** Additions to AppPersistedState in AppContext.tsx */
interface PersistedStateExtensions {
  adaptiveModel?: AdaptiveModel;
  reportHistory: ReportHistoryEntry[];
  siblingGroups: SiblingGroup[];
  collaborationLogs: CollaborationLog[];
  portfolioEntries: PortfolioEntry[];
  routineConfig?: RoutineConfig;
  quests: Quest[];
  enhancedStreak?: EnhancedStreak;
  notificationPrefs?: NotificationPrefs;
  usagePattern?: UsagePattern;
  locale: SupportedLocale;
  sensoryProfiles: Record<string, SensoryProfile>; // keyed by childId
  bondingScores: WeeklyBondingScore[];
}
```

---

## 21. Edge Function API Contracts

All new endpoints are added to the existing Hono app in
`supabase/functions/server/index.tsx`.

### POST /ml/aggregate

```
Authorization: Bearer <supabase-anon-key>
Content-Type: application/json

Request:
{
  "regionWeights": { "Linguistic": 0.72, "Creative": 0.45, ... },
  "sampleCount": 42
}

Response 200:
{
  "globalWeights": { "Linguistic": 0.68, "Creative": 0.51, ... },
  "totalSamples": 15280
}

Response 429:
{ "error": "rate_limit_exceeded", "retryAfterSeconds": 600 }
```

### POST /report/email

```
Authorization: Bearer <supabase-anon-key>
Content-Type: application/json

Request:
{
  "pdfBase64": "<base64-encoded PDF>",
  "recipientEmail": "teacher@school.edu",
  "childName": "Aria",
  "senderName": "Parent Name",
  "weekLabel": "Mar 24 - Mar 30, 2026"
}

Response 200:
{ "sent": true, "messageId": "msg_abc123" }

Response 400:
{ "error": "invalid_email" }
```

### POST /voice/synthesize

```
Authorization: Bearer <supabase-anon-key>
Content-Type: application/json

Request:
{
  "text": "Step 1: Gather your materials...",
  "language": "hi-IN",
  "voicePreference": "female-warm",
  "activityId": "a01",
  "stepIndex": 0
}

Response 200:
{
  "audioUrl": "https://xxx.supabase.co/storage/v1/object/tts-cache/a01-hi-0.mp3",
  "durationSeconds": 4.2,
  "cached": true
}

Response 402:
{ "error": "premium_required" }
```

### POST /i18n/translate

```
Authorization: Bearer <supabase-anon-key>
Content-Type: application/json

Request:
{
  "strings": { "home.greeting": "Good morning", "brain.coverage": "Neural Coverage" },
  "targetLang": "hi",
  "namespace": "app"
}

Response 200:
{
  "translations": { "home.greeting": "सुप्रभात", "brain.coverage": "न्यूरल कवरेज" },
  "language": "hi",
  "cached": false,
  "storageUrl": "https://xxx.supabase.co/storage/v1/object/i18n/hi/app.json"
}

Response 429:
{ "error": "translation_limit_reached", "retryAfterHours": 24 }
```

### POST /narrative/generate

```
Authorization: Bearer <supabase-anon-key>
Content-Type: application/json

Request:
{
  "childName": "Aria",
  "childAge": 4,
  "ageTier": 2,
  "weekStart": "2026-03-24",
  "weekEnd": "2026-03-30",
  "activityCount": 8,
  "bpEarned": 120,
  "streak": 12,
  "regionDeltas": [
    { "name": "Creative", "before": 8, "after": 11, "trend": "up" },
    { "name": "Linguistic", "before": 6, "after": 7, "trend": "up" }
  ],
  "milestonesChecked": ["m_first_story"]
}

Response 200:
{
  "narrative": "Aria had a wonderful week of brain-building...",
  "generatedAt": "2026-03-30T18:00:00Z",
  "model": "gpt-4o",
  "cached": false
}

Response 402:
{ "error": "premium_required" }
```

### POST /coach (extended for activity coaching)

```
Authorization: Bearer <supabase-anon-key>
Content-Type: application/json

Request:
{
  "type": "activity-coaching",
  "activityId": "a01",
  "activityName": "Rice Sensory Bin",
  "intelligences": ["Bodily-Kinesthetic", "Naturalist", "Linguistic"],
  "childProfile": { "age": 3, "name": "Aria", "learningStyle": "kinesthetic" },
  "kycData": { "patience": 5, "energy": 7, "sensitivity": 6 },
  "phase": "during",
  "isPremium": true
}

Response 200:
{
  "tips": [
    "Let Aria lead the exploration — resist the urge to direct",
    "Name textures as she touches them: 'smooth rice', 'bumpy spoon'",
    "If she throws rice, redirect: 'Let's see how rice sounds in the cup!'"
  ],
  "languageExamples": [
    { "situation": "Child loses interest", "say": "I wonder what's hiding at the bottom?", "avoid": "Come on, keep playing" }
  ],
  "timerPrompt": "In 3 minutes, ask: 'Which object was your favorite to find?'"
}
```

---

## 22. SQL Migration Schemas

### 00004_portfolio.sql

```sql
-- Portfolio entries for child creation captures
-- Images stored in Supabase Storage bucket "portfolio-images"

create table if not exists public.portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  child_id text not null,
  activity_id text,
  image_storage_path text not null,
  intelligences text[] not null default '{}',
  tags text[] not null default '{}',
  caption text not null default '',
  stage text not null check (stage in ('sensorimotor', 'preoperational', 'concrete-operational', 'formal-operational')),
  include_in_report boolean not null default false,
  created_at timestamptz not null default now()
);

create index portfolio_entries_user_child_idx
  on public.portfolio_entries (user_id, child_id, created_at desc);

alter table public.portfolio_entries enable row level security;

create policy "portfolio_select_own"
  on public.portfolio_entries for select to authenticated
  using (auth.uid() = user_id);

create policy "portfolio_insert_own"
  on public.portfolio_entries for insert to authenticated
  with check (auth.uid() = user_id);

create policy "portfolio_update_own"
  on public.portfolio_entries for update to authenticated
  using (auth.uid() = user_id);

create policy "portfolio_delete_own"
  on public.portfolio_entries for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.portfolio_entries to authenticated;

-- Storage bucket (run via Dashboard or Supabase CLI):
-- insert into storage.buckets (id, name, public) values ('portfolio-images', 'portfolio-images', false);
-- Storage RLS: authenticated users can CRUD their own path prefix (user_id/*)
```

### 00005_community_ratings.sql

```sql
-- Aggregated community activity ratings (no individual user data)
-- Populated by edge function batch flush from KV

create table if not exists public.activity_ratings_agg (
  id uuid primary key default gen_random_uuid(),
  activity_id text not null,
  age_tier smallint not null,
  engagement_avg numeric(3,2) not null default 0,
  completion_rate numeric(3,2) not null default 0,
  total_ratings integer not null default 0,
  difficulty_too_easy integer not null default 0,
  difficulty_right integer not null default 0,
  difficulty_too_hard integer not null default 0,
  last_7_days_ratings integer not null default 0,
  first_rating_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, age_tier)
);

create index activity_ratings_lookup_idx
  on public.activity_ratings_agg (activity_id, age_tier);

alter table public.activity_ratings_agg enable row level security;

-- Public read for all authenticated users (aggregated, no PII)
create policy "ratings_select_authenticated"
  on public.activity_ratings_agg for select to authenticated
  using (true);

-- Only service_role can write (edge function uses service key)
create policy "ratings_upsert_service"
  on public.activity_ratings_agg for all to service_role
  using (true) with check (true);

grant select on public.activity_ratings_agg to authenticated;
grant all on public.activity_ratings_agg to service_role;

create or replace function public.set_ratings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ratings_set_updated_at
  before update on public.activity_ratings_agg
  for each row execute function public.set_ratings_updated_at();
```

### 00006_caregivers.sql

```sql
-- Multi-caregiver links with role-based access
-- Enables multiple users to contribute to a child's development tracking

create table if not exists public.caregiver_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  child_id text not null,
  role text not null check (role in ('primary', 'caregiver', 'observer')),
  invited_by uuid not null references auth.users (id),
  accepted_at timestamptz,
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  unique (user_id, child_id)
);

create index caregiver_links_child_idx
  on public.caregiver_links (child_id);

create index caregiver_links_user_idx
  on public.caregiver_links (user_id);

alter table public.caregiver_links enable row level security;

-- Users can see links for children they are linked to
create policy "caregiver_select_linked"
  on public.caregiver_links for select to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
        and cl.user_id = auth.uid()
    )
  );

-- Only primary caregivers can insert new links
create policy "caregiver_insert_primary"
  on public.caregiver_links for insert to authenticated
  with check (
    exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
        and cl.user_id = auth.uid()
        and cl.role = 'primary'
    )
    or not exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
    )
  );

-- Primary can update roles; users can update their own display_name
create policy "caregiver_update"
  on public.caregiver_links for update to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
        and cl.user_id = auth.uid()
        and cl.role = 'primary'
    )
  );

-- Only primary can delete links (or self-remove)
create policy "caregiver_delete"
  on public.caregiver_links for delete to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.caregiver_links cl
      where cl.child_id = caregiver_links.child_id
        and cl.user_id = auth.uid()
        and cl.role = 'primary'
    )
  );

grant select, insert, update, delete on public.caregiver_links to authenticated;
```

### 00007_narrative_cache.sql

```sql
-- Cache for AI-generated weekly progress narratives
-- One narrative per child per week, cached to avoid redundant OpenAI calls

create table if not exists public.narrative_cache (
  id uuid primary key default gen_random_uuid(),
  child_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  week_end date not null,
  narrative text not null,
  model text not null default 'gpt-4o',
  generated_at timestamptz not null default now(),
  unique (child_id, week_start)
);

create index narrative_cache_child_week_idx
  on public.narrative_cache (child_id, week_start desc);

alter table public.narrative_cache enable row level security;

create policy "narrative_select_own"
  on public.narrative_cache for select to authenticated
  using (auth.uid() = user_id);

create policy "narrative_insert_own"
  on public.narrative_cache for insert to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.narrative_cache to authenticated;
grant all on public.narrative_cache to service_role;
```

---

## 23. Implementation Priority Matrix

### Priority Tiers

| Priority | Modules | Rationale |
|----------|---------|-----------|
| **P0 — Ship First** | 4 (Voice), 2 (Report), 9 (Sensory), 7 (Coaching) | Highest immediate user value; differentiates from every competitor; voice is zero-cost via Web Speech API |
| **P1 — High Impact** | 5 (i18n), 1 (AI Adapt), 10 (Ratings), 18 (Notifications) | Unlocks TAM (30 languages = 10x addressable market); AI adaptation improves retention |
| **P2 — Differentiators** | 6 (Portfolio), 3 (Sibling), 11 (Predictor), 17 (Narratives) | Unique features no competitor offers; creates emotional lock-in (portfolio, narratives) |
| **P3 — Polish** | 8 (Seasonal), 12 (Routine), 13 (Bonding), 14 (Gamification), 15 (Offline), 16 (Caregiver) | Deep engagement features; caregiver + offline for enterprise/school market |

### Estimated Timeline (2-3 person team)

| Phase | Weeks | Modules | Milestones |
|-------|-------|---------|------------|
| **Foundation** | 1-3 | Infra: i18n context, cloud sync, Capacitor plugins, `isPremium` real flag | Infra PR merged, env provisioned |
| **P0 Sprint** | 4-9 | Voice (4), Report (2), Sensory (9), Coaching (7) | Beta testers on all 4 features |
| **P1 Sprint** | 10-15 | i18n (5), AI Adapt (1), Ratings (10), Notifications (18) | 30 languages live, ML engine active |
| **P2 Sprint** | 16-23 | Portfolio (6), Sibling (3), Predictor (11), Narratives (17) | Camera flow, sibling packs, AI narratives |
| **P3 Sprint** | 24-32 | Seasonal (8), Routine (12), Bonding (13), Gamification (14), Offline (15), Caregiver (16) | Feature-complete "ultra" app |

### Critical Path

```
Foundation (i18n + cloud sync + Capacitor + isPremium)
  ├── P0: Voice (depends on i18n for language param)
  ├── P0: Report (depends on @react-pdf/renderer)
  ├── P0: Sensory (no dependencies)
  └── P0: Coaching (depends on /coach endpoint extension)
        │
        ├── P1: i18n full rollout (depends on string extraction)
        ├── P1: AI Adapt (no dependencies)
        ├── P1: Ratings (depends on cloud sync)
        └── P1: Notifications (depends on Capacitor)
              │
              ├── P2: Portfolio (depends on Capacitor camera)
              ├── P2: Sibling (depends on multi-child cloud sync)
              ├── P2: Predictor (no dependencies)
              └── P2: Narratives (depends on /narrative edge endpoint)
```

---

## 24. Dependency Graph

```
Module 5 (i18n) ─────────► Module 4 (Voice — language param)
                            Module 8 (Seasonal — localized celebrations)

Infrastructure: cloud sync ► Module 10 (Ratings — Postgres flush)
                              Module 16 (Caregiver — Realtime sync)
                              Module 3 (Sibling — shared logs)

Infrastructure: Capacitor ──► Module 6 (Portfolio — camera)
                              Module 18 (Notifications — local push)

Module 2 (Report) ◄───────── Module 6 (Portfolio — include in report)
                   ◄───────── Module 17 (Narratives — AI paragraph in PDF)

Module 7 (Coaching) ◄──────── Module 4 (Voice — narrate coaching tips)

Module 1 (AI Adapt) ◄──────── Module 10 (Ratings — community signal input)

Module 14 (Gamification) ◄─── Module 12 (Routine — time-based quest triggers)

Module 15 (Offline) ◄──────── Module 4 (Voice — cache narration scripts)
                    ◄──────── Module 7 (Coaching — cache coaching data)
```

---

## 25. Monetization Integration

### Free vs Premium Tier Mapping

| Feature | Free | Premium |
|---------|------|---------|
| AI Adaptation | Last 7 days only | Full 14-day window + federated |
| Weekly Report | 1 per month, no AI narrative | Unlimited, AI narratives, email |
| Sibling Mode | 2-child limit | Unlimited children |
| Voice Mode | Web Speech API (basic) | Premium Google TTS voices |
| Languages | English + 1 other | All 30 languages |
| Portfolio | 3 photos/month | Unlimited + cloud sync |
| Parent Coaching | Static tips only | AI-powered contextual coaching |
| Seasonal | Current season only | Full year + cultural calendar |
| Sensory | 1 condition profile | Full multi-condition profiles |
| Community Ratings | View only | View + trending + influence |
| Milestone Predictor | Next milestone only | Full trajectory analysis |
| Routine Optimizer | Basic windows | Full drag-to-schedule |
| Bonding Tracker | Weekly score only | Full journey + joy moments |
| Gamification | Daily quests only | Weekly + monthly + streak freeze |
| Offline Packs | 1-day pack | 7-day pack |
| Multi-Caregiver | 1 caregiver | Unlimited + observer role |
| Narratives | None | Full AI narratives |
| Notifications | Daily reminder only | All 5 types, smart scheduling |

### Implementation

Replace the hardcoded `const isPremium = true` in `src/components/brain/BrainPanel.tsx`
with a real check:

```typescript
// src/lib/subscription/premiumCheck.ts
export function useIsPremium(): boolean {
  const { user, credits } = useApp();
  // v1: credit-based (existing system)
  if (credits > 0) return true;
  // v2: Supabase subscription table check
  // if (user?.supabaseUid) return checkSubscription(user.supabaseUid);
  return false;
}
```

Gate each module's premium features using `useIsPremium()` with a soft paywall
that shows a preview of the premium output before asking to upgrade.

---

*Document generated: April 2026*
*Version: 1.0*
*Modules: 18*
*Estimated total effort: 5-6 months (2-3 person team)*

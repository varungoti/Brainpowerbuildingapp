export const MAX_BRAIN_REGION_SCORE = 20;

export type BrainRevealDirection = "left" | "right" | "top" | "bottom";

export type BrainRegionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BrainRegionVisual = {
  paths: string[];
  bounds: BrainRegionBounds;
  revealFrom: BrainRevealDirection;
};

export type BrainRegion = {
  id: string;
  key: string;
  name: string;
  emoji: string;
  color: string;
  lobe: string;
  desc: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  labelX: number;
  labelY: number;
  connTo: number[];
};

export const BRAIN_REGIONS: readonly BrainRegion[] = [
  {
    id: "executive",
    key: "Executive Function",
    name: "Executive",
    emoji: "🧩",
    color: "#F2B0BC",
    lobe: "Prefrontal Cortex",
    desc: "Planning, decision-making & impulse control - the brain's CEO.",
    cx: 184,
    cy: 83,
    rx: 22,
    ry: 22,
    labelX: 190,
    labelY: 42,
    connTo: [1, 2, 3, 5, 13],
  },
  {
    id: "linguistic",
    key: "Linguistic",
    name: "Language",
    emoji: "🗣️",
    color: "#BFEFF2",
    lobe: "Left Frontal (Broca's Area)",
    desc: "Reading, writing, storytelling and language acquisition.",
    cx: 82,
    cy: 73,
    rx: 20,
    ry: 20,
    labelX: 64,
    labelY: 96,
    connTo: [0, 6, 13],
  },
  {
    id: "creative",
    key: "Creative",
    name: "Creative",
    emoji: "🎨",
    color: "#CBB8F4",
    lobe: "Right Frontal Lobe",
    desc: "Imagination, artistic thinking, divergent problem-solving.",
    cx: 228,
    cy: 88,
    rx: 20,
    ry: 20,
    labelX: 264,
    labelY: 88,
    connTo: [0, 4, 14],
  },
  {
    id: "logical",
    key: "Logical-Mathematical",
    name: "Logical",
    emoji: "🔢",
    color: "#D9DD67",
    lobe: "Left Parietal Lobe",
    desc: "Number sense, pattern recognition, scientific reasoning.",
    cx: 136,
    cy: 111,
    rx: 19,
    ry: 19,
    labelX: 98,
    labelY: 136,
    connTo: [0, 4, 8],
  },
  {
    id: "spatial",
    key: "Spatial-Visual",
    name: "Spatial",
    emoji: "🎯",
    color: "#BCCA74",
    lobe: "Right Parietal Lobe",
    desc: "Mental rotation, navigation, design thinking.",
    cx: 302,
    cy: 146,
    rx: 19,
    ry: 19,
    labelX: 346,
    labelY: 154,
    connTo: [2, 3, 14],
  },
  {
    id: "emotional",
    key: "Emotional",
    name: "Emotional",
    emoji: "❤️",
    color: "#F6A8A6",
    lobe: "Limbic System (Amygdala)",
    desc: "Emotional intelligence, empathy, self-awareness.",
    cx: 183,
    cy: 128,
    rx: 22,
    ry: 22,
    labelX: 204,
    labelY: 118,
    connTo: [0, 7, 9],
  },
  {
    id: "musical",
    key: "Musical-Rhythmic",
    name: "Musical",
    emoji: "🎵",
    color: "#F0B37F",
    lobe: "Left Temporal (Auditory Cortex)",
    desc: "Rhythm, melody, beat & pitch.",
    cx: 158,
    cy: 185,
    rx: 18,
    ry: 18,
    labelX: 102,
    labelY: 214,
    connTo: [1, 8, 13],
  },
  {
    id: "social",
    key: "Interpersonal",
    name: "Social",
    emoji: "🤝",
    color: "#94E55C",
    lobe: "Right Temporal Lobe",
    desc: "Reading social cues, cooperation, leadership.",
    cx: 192,
    cy: 244,
    rx: 18,
    ry: 18,
    labelX: 326,
    labelY: 234,
    connTo: [5, 10],
  },
  {
    id: "bodily",
    key: "Bodily-Kinesthetic",
    name: "Bodily",
    emoji: "🏃",
    color: "#7A69E8",
    lobe: "Motor Cortex & Cerebellum",
    desc: "Motor skills, body awareness, physical intelligence.",
    cx: 48,
    cy: 232,
    rx: 18,
    ry: 18,
    labelX: 42,
    labelY: 278,
    connTo: [6, 11, 14],
  },
  {
    id: "intrapersonal",
    key: "Intrapersonal",
    name: "Self",
    emoji: "🧘",
    color: "#CB84CB",
    lobe: "Default Mode Network",
    desc: "Self-knowledge, mindfulness, reflective thinking.",
    cx: 142,
    cy: 286,
    rx: 18,
    ry: 18,
    labelX: 176,
    labelY: 240,
    connTo: [5, 11, 12],
  },
  {
    id: "naturalist",
    key: "Naturalist",
    name: "Nature",
    emoji: "🌿",
    color: "#AEEED4",
    lobe: "Right Cerebellum",
    desc: "Pattern recognition in nature, categorisation.",
    cx: 300,
    cy: 58,
    rx: 18,
    ry: 18,
    labelX: 334,
    labelY: 72,
    connTo: [7, 12],
  },
  {
    id: "existential",
    key: "Existential",
    name: "Wonder",
    emoji: "✨",
    color: "#D98BE0",
    lobe: "Left Occipital",
    desc: "Deep questioning, wonder, philosophy.",
    cx: 36,
    cy: 126,
    rx: 16,
    ry: 16,
    labelX: 86,
    labelY: 148,
    connTo: [8, 9],
  },
  {
    id: "digital",
    key: "Digital-Technological",
    name: "Digital",
    emoji: "💻",
    color: "#E8D6CE",
    lobe: "Right Occipital",
    desc: "Computational thinking, systems understanding.",
    cx: 309,
    cy: 112,
    rx: 16,
    ry: 16,
    labelX: 336,
    labelY: 118,
    connTo: [9, 10],
  },
  {
    id: "pronunciation",
    key: "Pronunciation",
    name: "Speech",
    emoji: "👅",
    color: "#F08B9A",
    lobe: "Broca's & Wernicke's Areas",
    desc: "Articulation, phonological awareness, speech clarity.",
    cx: 18,
    cy: 132,
    rx: 17,
    ry: 17,
    labelX: 22,
    labelY: 178,
    connTo: [0, 1, 6, 3],
  },
  {
    id: "coordination",
    key: "Coordination",
    name: "Coordination",
    emoji: "🤹",
    color: "#C7D377",
    lobe: "Cerebellum & Basal Ganglia",
    desc: "Hand-eye coordination, finger dexterity.",
    cx: 321,
    cy: 198,
    rx: 17,
    ry: 17,
    labelX: 360,
    labelY: 214,
    connTo: [2, 4, 7, 8],
  },
] as const;

export const BRAIN_REGION_VISUALS: Record<string, BrainRegionVisual> = {
  executive: {
    paths: [
      "M147 51 L167 43 L193 46 L206 61 L202 83 L183 95 L160 92 L147 75 Z",
      "M171 92 L186 87 L200 93 L204 107 L198 121 L185 127 L172 120 L168 105 Z",
    ],
    bounds: { x: 147, y: 43, width: 59, height: 84 },
    revealFrom: "bottom",
  },
  linguistic: {
    paths: [
      "M41 48 L61 39 L87 39 L111 46 L122 57 L118 73 L98 84 L73 84 L49 75 L39 61 Z",
      "M32 77 L44 71 L58 72 L67 79 L68 92 L59 102 L44 105 L31 99 L27 88 Z",
    ],
    bounds: { x: 27, y: 39, width: 95, height: 66 },
    revealFrom: "left",
  },
  creative: {
    paths: [
      "M205 45 L223 39 L240 42 L246 57 L241 76 L229 91 L214 91 L205 77 L202 59 Z",
      "M226 90 L239 85 L251 90 L256 104 L250 120 L238 127 L226 122 L221 108 Z",
    ],
    bounds: { x: 202, y: 39, width: 54, height: 88 },
    revealFrom: "top",
  },
  logical: {
    paths: ["M117 98 L131 91 L147 95 L152 108 L143 120 L126 122 L115 112 Z"],
    bounds: { x: 115, y: 91, width: 37, height: 31 },
    revealFrom: "left",
  },
  spatial: {
    paths: ["M282 119 L297 113 L313 116 L321 130 L317 147 L304 159 L290 156 L281 141 Z"],
    bounds: { x: 281, y: 113, width: 40, height: 46 },
    revealFrom: "right",
  },
  emotional: {
    paths: [
      "M150 86 L166 79 L185 80 L198 90 L198 109 L189 128 L173 139 L156 132 L147 115 Z",
      "M177 139 L190 135 L202 141 L206 154 L199 168 L186 173 L174 166 L171 152 Z",
    ],
    bounds: { x: 147, y: 79, width: 59, height: 94 },
    revealFrom: "bottom",
  },
  musical: {
    paths: ["M89 166 L122 159 L155 159 L184 164 L202 173 L198 186 L176 194 L145 196 L112 193 L90 187 L80 174 Z"],
    bounds: { x: 80, y: 159, width: 122, height: 37 },
    revealFrom: "left",
  },
  social: {
    paths: [
      "M75 219 L115 213 L161 213 L208 217 L248 223 L279 232 L292 243 L289 255 L258 263 L208 267 L154 265 L106 258 L77 249 L69 232 Z",
      "M279 205 L294 199 L309 201 L318 210 L317 224 L307 234 L292 235 L280 227 L275 214 Z",
    ],
    bounds: { x: 69, y: 199, width: 249, height: 68 },
    revealFrom: "right",
  },
  bodily: {
    paths: ["M20 211 L32 202 L48 202 L61 212 L62 229 L54 245 L40 252 L26 246 L19 228 Z"],
    bounds: { x: 19, y: 202, width: 43, height: 50 },
    revealFrom: "left",
  },
  intrapersonal: {
    paths: ["M77 273 L103 267 L136 268 L163 272 L177 282 L171 292 L145 297 L109 296 L82 290 L69 281 Z"],
    bounds: { x: 69, y: 267, width: 108, height: 30 },
    revealFrom: "bottom",
  },
  naturalist: {
    paths: ["M242 31 L273 24 L307 25 L334 34 L346 46 L342 59 L316 68 L279 69 L248 64 L235 52 Z"],
    bounds: { x: 235, y: 24, width: 111, height: 45 },
    revealFrom: "right",
  },
  existential: {
    paths: ["M14 119 L25 108 L40 105 L51 113 L51 127 L42 139 L28 142 L16 136 Z"],
    bounds: { x: 14, y: 105, width: 37, height: 37 },
    revealFrom: "left",
  },
  digital: {
    paths: [
      "M263 48 L293 42 L321 45 L342 56 L350 79 L347 111 L338 139 L322 159 L301 165 L283 158 L271 140 L265 113 L262 80 Z",
      "M291 160 L307 156 L323 158 L332 166 L332 181 L323 191 L307 195 L294 190 L287 177 Z",
    ],
    bounds: { x: 262, y: 42, width: 88, height: 153 },
    revealFrom: "right",
  },
  pronunciation: {
    paths: ["M8 125 L14 120 L22 122 L25 129 L20 138 L12 140 L8 133 Z"],
    bounds: { x: 8, y: 120, width: 17, height: 20 },
    revealFrom: "left",
  },
  coordination: {
    paths: ["M303 178 L317 173 L331 176 L339 188 L337 202 L327 212 L313 213 L303 206 L298 191 Z"],
    bounds: { x: 298, y: 173, width: 41, height: 40 },
    revealFrom: "right",
  },
};

export const BRAIN_REGION_CONNECTIONS = BRAIN_REGIONS.flatMap((region, sourceIdx) =>
  region.connTo
    .filter((targetIdx) => sourceIdx < targetIdx)
    .map((targetIdx) => [sourceIdx, targetIdx] as [number, number]),
);

export const BRAIN_REGION_KEYS = BRAIN_REGIONS.map((region) => region.key);

export function getBrainRegionPercent(score: number) {
  return Math.max(0, Math.min(100, Math.round((score / MAX_BRAIN_REGION_SCORE) * 100)));
}

export function getBrainCoveragePercent(scores: Record<string, number>) {
  const totalScore = BRAIN_REGION_KEYS.reduce((sum, key) => sum + (scores[key] ?? 0), 0);
  return Math.min(
    100,
    Math.round((totalScore / (BRAIN_REGIONS.length * MAX_BRAIN_REGION_SCORE)) * 100),
  );
}

export function getActiveBrainRegionCount(scores: Record<string, number>) {
  return BRAIN_REGION_KEYS.filter((key) => (scores[key] ?? 0) > 0).length;
}

export function getSortedBrainRegionProgress(scores: Record<string, number>) {
  return BRAIN_REGIONS.map((region) => ({
    ...region,
    score: scores[region.key] ?? 0,
    percent: getBrainRegionPercent(scores[region.key] ?? 0),
  })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function getTopBrainRegions(scores: Record<string, number>, count = 3) {
  return getSortedBrainRegionProgress(scores).filter((region) => region.score > 0).slice(0, count);
}

export function buildRegionScoresFromWeightedKeys(
  groups: Array<{ keys: string[]; weight: number }>,
  scaleMax = MAX_BRAIN_REGION_SCORE,
) {
  const totals = Object.fromEntries(BRAIN_REGION_KEYS.map((key) => [key, 0])) as Record<string, number>;
  const maxes = Object.fromEntries(BRAIN_REGION_KEYS.map((key) => [key, 0])) as Record<string, number>;

  for (const group of groups) {
    for (const key of group.keys) {
      if (!(key in totals)) continue;
      totals[key] += group.weight;
      maxes[key] += 1;
    }
  }

  for (const key of BRAIN_REGION_KEYS) {
    const max = maxes[key];
    if (!max) continue;
    totals[key] = Math.round((totals[key] / max) * scaleMax);
  }

  return totals;
}

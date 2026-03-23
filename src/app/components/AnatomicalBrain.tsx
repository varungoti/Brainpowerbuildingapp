import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import brainBase from "../../assets/brain-progress-base.png";

// ─── Background ────────────────────────────────────────────────────────────
const BG = "#0b0e1d";

// ─── 15 Brain Regions (keys match activity intelligences + Pronunciation, Coordination) ───
const BRAIN_REGIONS = [
  { id: "executive", key: "Executive Function", name: "Executive", emoji: "🧩",
    cx: 184, cy: 83, rx: 22, ry: 22, color: "#F2B0BC",
    lobe: "Prefrontal Cortex",
    desc: "Planning, decision-making & impulse control — the brain's CEO.",
    labelX: 190, labelY: 42 },
  { id: "linguistic", key: "Linguistic", name: "Language", emoji: "🗣️",
    cx: 82, cy: 73, rx: 20, ry: 20, color: "#BFEFF2",
    lobe: "Left Frontal (Broca's Area)",
    desc: "Reading, writing, storytelling and language acquisition.",
    labelX: 64, labelY: 96 },
  { id: "creative", key: "Creative", name: "Creative", emoji: "🎨",
    cx: 228, cy: 88, rx: 20, ry: 20, color: "#CBB8F4",
    lobe: "Right Frontal Lobe",
    desc: "Imagination, artistic thinking, divergent problem-solving.",
    labelX: 264, labelY: 88 },
  { id: "logical", key: "Logical-Mathematical", name: "Logical", emoji: "🔢",
    cx: 136, cy: 111, rx: 19, ry: 19, color: "#D9DD67",
    lobe: "Left Parietal Lobe",
    desc: "Number sense, pattern recognition, scientific reasoning.",
    labelX: 98, labelY: 136 },
  { id: "spatial", key: "Spatial-Visual", name: "Spatial", emoji: "🎯",
    cx: 302, cy: 146, rx: 19, ry: 19, color: "#BCCA74",
    lobe: "Right Parietal Lobe",
    desc: "Mental rotation, navigation, design thinking.",
    labelX: 346, labelY: 154 },
  { id: "emotional", key: "Emotional", name: "Emotional", emoji: "❤️",
    cx: 183, cy: 128, rx: 22, ry: 22, color: "#F6A8A6",
    lobe: "Limbic System (Amygdala)",
    desc: "Emotional intelligence, empathy, self-awareness.",
    labelX: 204, labelY: 118 },
  { id: "musical", key: "Musical-Rhythmic", name: "Musical", emoji: "🎵",
    cx: 158, cy: 185, rx: 18, ry: 18, color: "#F0B37F",
    lobe: "Left Temporal (Auditory Cortex)",
    desc: "Rhythm, melody, beat & pitch.",
    labelX: 102, labelY: 214 },
  { id: "social", key: "Interpersonal", name: "Social", emoji: "🤝",
    cx: 192, cy: 244, rx: 18, ry: 18, color: "#94E55C",
    lobe: "Right Temporal Lobe",
    desc: "Reading social cues, cooperation, leadership.",
    labelX: 326, labelY: 234 },
  { id: "bodily", key: "Bodily-Kinesthetic", name: "Bodily", emoji: "🏃",
    cx: 48, cy: 232, rx: 18, ry: 18, color: "#7A69E8",
    lobe: "Motor Cortex & Cerebellum",
    desc: "Motor skills, body awareness, physical intelligence.",
    labelX: 42, labelY: 278 },
  { id: "intrapersonal", key: "Intrapersonal", name: "Self", emoji: "🧘",
    cx: 142, cy: 286, rx: 18, ry: 18, color: "#CB84CB",
    lobe: "Default Mode Network",
    desc: "Self-knowledge, mindfulness, reflective thinking.",
    labelX: 176, labelY: 240 },
  { id: "naturalist", key: "Naturalist", name: "Nature", emoji: "🌿",
    cx: 300, cy: 58, rx: 18, ry: 18, color: "#AEEED4",
    lobe: "Right Cerebellum",
    desc: "Pattern recognition in nature, categorisation.",
    labelX: 334, labelY: 72 },
  { id: "existential", key: "Existential", name: "Wonder", emoji: "✨",
    cx: 36, cy: 126, rx: 16, ry: 16, color: "#D98BE0",
    lobe: "Left Occipital",
    desc: "Deep questioning, wonder, philosophy.",
    labelX: 86, labelY: 148 },
  { id: "digital", key: "Digital-Technological", name: "Digital", emoji: "💻",
    cx: 309, cy: 112, rx: 16, ry: 16, color: "#E8D6CE",
    lobe: "Right Occipital",
    desc: "Computational thinking, systems understanding.",
    labelX: 336, labelY: 118 },
  { id: "pronunciation", key: "Pronunciation", name: "Speech", emoji: "👅",
    cx: 18, cy: 132, rx: 17, ry: 17, color: "#F08B9A",
    lobe: "Broca's & Wernicke's Areas",
    desc: "Articulation, phonological awareness, speech clarity.",
    labelX: 22, labelY: 178 },
  { id: "coordination", key: "Coordination", name: "Coordination", emoji: "🤹",
    cx: 321, cy: 198, rx: 17, ry: 17, color: "#C7D377",
    lobe: "Cerebellum & Basal Ganglia",
    desc: "Hand-eye coordination, finger dexterity.",
    labelX: 360, labelY: 214 },
] as const;

const MAX_SCORE = 20;

type RevealDirection = "left" | "right" | "top" | "bottom";

type RegionBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RegionVisual = {
  paths: string[];
  bounds: RegionBounds;
  revealFrom: RevealDirection;
};

const REGION_VISUALS: Record<string, RegionVisual> = {
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

function getRevealRect(bounds: RegionBounds, revealFrom: RevealDirection, pct: number) {
  const boundedPct = Math.max(0, Math.min(1, pct));
  const minX = bounds.x;
  const maxX = bounds.x + bounds.width;
  const minY = bounds.y;
  const maxY = bounds.y + bounds.height;

  if (revealFrom === "left") {
    return { x: minX, y: minY, width: bounds.width * boundedPct, height: bounds.height };
  }
  if (revealFrom === "right") {
    return {
      x: maxX - bounds.width * boundedPct,
      y: minY,
      width: bounds.width * boundedPct,
      height: bounds.height,
    };
  }
  if (revealFrom === "top") {
    return { x: minX, y: minY, width: bounds.width, height: bounds.height * boundedPct };
  }
  return {
    x: minX,
    y: maxY - bounds.height * boundedPct,
    width: bounds.width,
    height: bounds.height * boundedPct,
  };
}

// Neural pathway connections (indices into BRAIN_REGIONS)
const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 5], [0, 13],
  [1, 6], [1, 13], [2, 4], [2, 14], [3, 4], [3, 13],
  [4, 14], [5, 7], [5, 9],
  [6, 8], [6, 13], [7, 10], [7, 14],
  [8, 11], [8, 14], [9, 11], [9, 12], [10, 12],
];

interface Props {
  scores: Record<string, number>;
}

export function AnatomicalBrain({ scores }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(iv);
  }, []);

  const showLabelIdx = hovered ?? selected;

  return (
    <div className="relative w-full">
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "1.45", backgroundColor: BG }}
      >
        {/* Framed background */}
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 50%, rgba(38,57,103,0.95) 0%, transparent 72%),
              radial-gradient(ellipse 45% 35% at 30% 42%, rgba(114,9,183,0.42) 0%, transparent 55%),
              radial-gradient(ellipse 48% 38% at 70% 38%, rgba(67,97,238,0.36) 0%, transparent 55%)`,
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[48%] pointer-events-none"
          style={{
            width: "84%",
            height: "78%",
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 72%)",
            filter: "blur(12px)",
          }}
        />

        {/* SVG overlay */}
        <svg
          viewBox="0 0 400 360"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <radialGradient id="brainTint" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="55%" stopColor="rgba(108,124,176,0.12)" />
              <stop offset="100%" stopColor="rgba(8,10,24,0.3)" />
            </radialGradient>
            <filter id="abGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="abSoft" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="18" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="labelShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.7)" />
            </filter>
            <clipPath id="brainClip">
              <ellipse cx="206" cy="170" rx="168" ry="128" />
            </clipPath>
            {BRAIN_REGIONS.map((region) => (
              <clipPath key={`clip-${region.id}`} id={`regionClip-${region.id}`}>
                {REGION_VISUALS[region.id].paths.map((path, idx) => (
                  <path
                    key={`${region.id}-${idx}`}
                    d={path}
                  />
                ))}
              </clipPath>
            ))}
            <style>{`
              @keyframes abDash { from { stroke-dashoffset: 4 } to { stroke-dashoffset: 0 } }
              @keyframes abPulse { 0%, 100% { opacity: 0.8 } 50% { opacity: 0.48 } }
              @keyframes abShimmer { from { transform: translateX(-80px) rotate(18deg); } to { transform: translateX(120px) rotate(18deg); } }
            `}</style>
          </defs>

          <ellipse
            cx="206"
            cy="178"
            rx="176"
            ry="134"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
          />
          <image
            href={brainBase}
            x="18"
            y="28"
            width="368"
            height="304"
            preserveAspectRatio="xMidYMid meet"
            clipPath="url(#brainClip)"
            opacity="0.24"
          />
          <image
            href={brainBase}
            x="18"
            y="28"
            width="368"
            height="304"
            preserveAspectRatio="xMidYMid meet"
            clipPath="url(#brainClip)"
            opacity="0.82"
            style={{ filter: "grayscale(1) saturate(0.25) brightness(0.42) contrast(1.1)" }}
          />
          <ellipse
            cx="206"
            cy="178"
            rx="162"
            ry="121"
            fill="url(#brainTint)"
            opacity="0.14"
          />

          {/* Neural connection lines */}
          {CONNECTIONS.map(([a, b], i) => {
            const ra = BRAIN_REGIONS[a];
            const rb = BRAIN_REGIONS[b];
            const sa = (scores[ra.key] ?? 0) / MAX_SCORE;
            const sb = (scores[rb.key] ?? 0) / MAX_SCORE;
            if (!sa && !sb) return null;
            const both = sa > 0 && sb > 0;
            const str = Math.max(sa, sb);
            return (
              <line
                key={`conn-${i}`}
                x1={ra.cx}
                y1={ra.cy}
                x2={rb.cx}
                y2={rb.cy}
                stroke={both ? `rgba(255,255,255,${0.18 + str * 0.35})` : "rgba(255,255,255,0.08)"}
                strokeWidth={both ? 1.2 + str * 1.8 : 0.76}
                strokeDasharray="8 5"
                style={{ animation: `abDash ${1.8 + i * 0.1}s linear infinite` }}
              />
            );
          })}

          {/* Region ellipses */}
          {BRAIN_REGIONS.map((region, idx) => {
            const score = scores[region.key] ?? 0;
            const pct = Math.min(1, score / MAX_SCORE);
            const isSel = selected === idx;
            const isHov = hovered === idx;
            const isActive = pct > 0;
            const isHighlighted = isSel || isHov;
            const visual = REGION_VISUALS[region.id];
            const revealRect = getRevealRect(visual.bounds, visual.revealFrom, pct);
            const bounds = visual.bounds;

            const fillOp = isHighlighted ? 0.34 + pct * 0.25 : isActive ? 0.14 + pct * 0.46 : 0;
            const strokeOpacity = isHighlighted ? 0.92 : isActive ? 0.55 : 0.34;
            const idleBoundaryOpacity = isHighlighted ? 0.18 : 0.1;

            const sparks = pct > 0.25
              ? Array.from({ length: Math.ceil(pct * 5) }, (_, pi) => {
                  const angle = ((tick * 2.5 + idx * 45 + pi * 72) % 360) * (Math.PI / 180);
                  const dist = region.rx * 0.75 + pi * 6 + Math.sin(tick * 0.07 + pi) * 5;
                  return {
                    cx: region.cx + Math.cos(angle) * dist,
                    cy: region.cy + Math.sin(angle) * dist,
                    r: 1.4 + pct * 1.2,
                    op: 0.25 + Math.sin(tick * 0.11 + pi * 1.8) * 0.22,
                  };
                })
              : [];

            const perimX = region.rx * 0.92;
            const perimY = region.ry * 0.92;
            const arcLen = Math.PI * (3 * (perimX + perimY) - Math.sqrt((3 * perimX + perimY) * (perimX + 3 * perimY)));

            return (
              <g
                key={region.id}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered(idx)}
                onTouchEnd={() => setHovered(null)}
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(selected === idx ? null : idx)}
              >
                <g clipPath={`url(#regionClip-${region.id})`}>
                  <rect
                    x={bounds.x - 8}
                    y={bounds.y - 8}
                    width={bounds.width + 16}
                    height={bounds.height + 16}
                    fill={region.color}
                    opacity={isHighlighted ? 0.18 : isActive ? 0.08 + pct * 0.14 : idleBoundaryOpacity}
                    filter="url(#abSoft)"
                  />
                </g>
                <g clipPath={`url(#regionClip-${region.id})`}>
                  {pct > 0 && (
                    <motion.rect
                      initial={false}
                      animate={revealRect}
                      transition={{ duration: 0.95, ease: "easeOut" }}
                      fill={region.color}
                      fillOpacity={fillOp}
                      filter={isHighlighted ? "url(#abGlow)" : undefined}
                      style={{ mixBlendMode: "screen" }}
                    />
                  )}
                  {(isActive || isHighlighted) && (
                    <rect
                      x={bounds.x}
                      y={bounds.y}
                      width={bounds.width}
                      height={bounds.height}
                      fill={`url(#brainTint)`}
                      opacity={0.08 + pct * 0.18}
                    />
                  )}
                  {!isActive && !isHighlighted && (
                    <rect
                      x={bounds.x}
                      y={bounds.y}
                      width={bounds.width}
                      height={bounds.height}
                      fill={region.color}
                      opacity={0.06}
                    />
                  )}
                  {pct > 0.08 && (
                    <motion.rect
                      initial={false}
                      animate={{
                        x:
                          bounds.x -
                          bounds.width * 0.6 +
                          ((tick * (1.3 + pct * 0.5)) % (bounds.width * 2.1)),
                      }}
                      transition={{ duration: 0 }}
                      y={bounds.y - 12}
                      width={18}
                      height={bounds.height + 24}
                      fill="rgba(255,255,255,0.35)"
                      opacity={0.15 + pct * 0.18}
                      style={{ filter: "blur(6px)" }}
                    />
                  )}
                </g>
                {visual.paths.map((path, partIdx) => (
                  <path
                    key={`stroke-${region.id}-${partIdx}`}
                    d={path}
                    fill="none"
                    stroke={region.color}
                    strokeWidth={isHighlighted ? 2.2 : isActive ? 1.7 : 1.05}
                    strokeOpacity={strokeOpacity}
                    filter={isHighlighted ? "url(#abGlow)" : undefined}
                    style={{ transition: "stroke-opacity 0.5s, stroke-width 0.2s" }}
                  />
                ))}
                {pct > 0 && (
                  <ellipse
                    cx={region.cx}
                    cy={region.cy}
                    rx={perimX}
                    ry={perimY}
                    fill="none"
                    stroke={region.color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeDasharray={`${pct * arcLen} ${arcLen}`}
                    transform={`rotate(-90, ${region.cx}, ${region.cy})`}
                    opacity={0.85}
                    style={{ filter: `drop-shadow(0 0 4px ${region.color})` }}
                  />
                )}
                {sparks.map((sp, pi) => (
                  <circle
                    key={`sp-${idx}-${pi}`}
                    cx={sp.cx}
                    cy={sp.cy}
                    r={sp.r}
                    fill="white"
                    opacity={sp.op}
                    style={{ filter: `drop-shadow(0 0 3px ${region.color})` }}
                  />
                ))}
              </g>
            );
          })}

          {/* Hover/Select tooltip */}
          {showLabelIdx !== null && (() => {
            const region = BRAIN_REGIONS[showLabelIdx];
            const score = scores[region.key] ?? 0;
            const pct = Math.round(Math.min(100, (score / MAX_SCORE) * 100));
            const isNearTop = region.labelY < 100;
            const tooltipY = isNearTop ? region.labelY + 38 : region.labelY - 42;
            const tooltipX = Math.max(85, Math.min(315, region.labelX));
            const labelText = region.name;
            const estWidth = Math.max(105, labelText.length * 7 + 55);
            const halfW = estWidth / 2;
            const arrowY = isNearTop ? tooltipY - 6 : tooltipY + 28;
            const arrowDir = isNearTop ? -1 : 1;

            return (
              <g style={{ pointerEvents: "none" }}>
                <line
                  x1={region.labelX}
                  y1={region.labelY}
                  x2={tooltipX}
                  y2={isNearTop ? tooltipY - 2 : tooltipY + 30}
                  stroke={region.color}
                  strokeWidth={1.2}
                  strokeOpacity={0.4}
                  strokeDasharray="3 2"
                />
                <rect
                  x={tooltipX - halfW}
                  y={tooltipY}
                  width={estWidth}
                  height={28}
                  rx={14}
                  fill="rgba(8,8,22,0.92)"
                  stroke={region.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.5}
                  filter="url(#labelShadow)"
                />
                <polygon
                  points={`${tooltipX - 5},${arrowY} ${tooltipX + 5},${arrowY} ${tooltipX},${arrowY + arrowDir * 7}`}
                  fill="rgba(8,8,22,0.92)"
                />
                <circle
                  cx={tooltipX - halfW + 14}
                  cy={tooltipY + 14}
                  r={4}
                  fill={region.color}
                  style={{ filter: `drop-shadow(0 0 4px ${region.color})` }}
                />
                <text
                  x={tooltipX - halfW + 28}
                  y={tooltipY + 17}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fontSize="12"
                  style={{ userSelect: "none" }}
                >
                  {region.emoji}
                </text>
                <text
                  x={tooltipX - halfW + 44}
                  y={tooltipY + 11}
                  fill="white"
                  fontSize="8"
                  fontWeight="800"
                  fontFamily="system-ui"
                  style={{ userSelect: "none" }}
                >
                  {region.name}
                </text>
                <text
                  x={tooltipX - halfW + 44}
                  y={tooltipY + 22}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="5.5"
                  fontWeight="500"
                  fontFamily="system-ui"
                  style={{ userSelect: "none" }}
                >
                  {region.lobe.length > 30 ? region.lobe.slice(0, 28) + "…" : region.lobe}
                </text>
                {score > 0 && (
                  <g>
                    <rect
                      x={tooltipX + halfW - 34}
                      y={tooltipY + 6}
                      width={26}
                      height={16}
                      rx={8}
                      fill={region.color}
                      fillOpacity={0.25}
                      stroke={region.color}
                      strokeWidth={0.5}
                      strokeOpacity={0.4}
                    />
                    <text
                      x={tooltipX + halfW - 21}
                      y={tooltipY + 17}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={region.color}
                      fontSize="7.5"
                      fontWeight="900"
                      style={{ userSelect: "none" }}
                    >
                      {pct}%
                    </text>
                  </g>
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="text-center mt-1 mb-1">
        <span className="text-white/20" style={{ fontSize: 9 }}>
          {selected !== null ? "Tap region again to deselect" : "Mapped color zones awaken as completed activities build each attribute"}
        </span>
      </div>

      <AnimatePresence>
        {selected !== null && (() => {
          const r = BRAIN_REGIONS[selected];
          const score = scores[r.key] ?? 0;
          const pct = Math.min(100, (score / MAX_SCORE) * 100);
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 440, damping: 32 }}
              className="mx-2 mb-2 rounded-2xl p-3.5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg,rgba(12,14,28,0.97),rgba(18,20,42,0.97))",
                border: `2px solid ${r.color}55`,
                boxShadow: `0 4px 32px ${r.color}22, inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              <div
                className="absolute -right-5 -top-5 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle,${r.color}30,transparent)` }}
              />
              <div className="flex items-start gap-3 relative">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: `${r.color}28`,
                    boxShadow: `0 0 20px ${r.color}28, inset 0 0 10px ${r.color}12`,
                  }}
                >
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-black text-white text-sm leading-tight">{r.name}</span>
                    <span
                      className="px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${r.color}28`, color: r.color, fontSize: 10 }}
                    >
                      {score}/{MAX_SCORE}
                    </span>
                  </div>
                  <div className="mb-0.5 font-medium" style={{ fontSize: 9, color: `${r.color}aa` }}>
                    {r.lobe}
                  </div>
                  <p className="text-white/58 leading-relaxed" style={{ fontSize: 10 }}>
                    {r.desc}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(null);
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <span className="text-white/45 text-xs font-bold leading-none">✕</span>
                </button>
              </div>
              <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  style={{
                    background: `linear-gradient(90deg,${r.color}77,${r.color})`,
                    boxShadow: `0 0 10px ${r.color}55`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-white/20" style={{ fontSize: 8 }}>Inactive</span>
                <span className="font-bold" style={{ fontSize: 10, color: r.color }}>
                  {Math.round(pct)}% developed
                </span>
                <span className="text-white/20" style={{ fontSize: 8 }}>Mastered</span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

export { BRAIN_REGIONS as ANATOMICAL_REGIONS, MAX_SCORE as ANATOMICAL_MAX_SCORE };

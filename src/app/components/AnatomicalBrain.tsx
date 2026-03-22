import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── Background ────────────────────────────────────────────────────────────
const BG = "#0b0e1d";

// ─── 15 Brain Regions (keys match activity intelligences + Pronunciation, Coordination) ───
const BRAIN_REGIONS = [
  { id: "executive", key: "Executive Function", name: "Executive", emoji: "🧩",
    cx: 200, cy: 72, rx: 22, ry: 22, color: "#4361EE",
    lobe: "Prefrontal Cortex",
    desc: "Planning, decision-making & impulse control — the brain's CEO.",
    labelX: 200, labelY: 45 },
  { id: "linguistic", key: "Linguistic", name: "Language", emoji: "🗣️",
    cx: 112, cy: 100, rx: 20, ry: 20, color: "#F72585",
    lobe: "Left Frontal (Broca's Area)",
    desc: "Reading, writing, storytelling and language acquisition.",
    labelX: 80, labelY: 100 },
  { id: "creative", key: "Creative", name: "Creative", emoji: "🎨",
    cx: 288, cy: 100, rx: 20, ry: 20, color: "#7209B7",
    lobe: "Right Frontal Lobe",
    desc: "Imagination, artistic thinking, divergent problem-solving.",
    labelX: 320, labelY: 100 },
  { id: "logical", key: "Logical-Mathematical", name: "Logical", emoji: "🔢",
    cx: 78, cy: 158, rx: 19, ry: 19, color: "#3A0CA3",
    lobe: "Left Parietal Lobe",
    desc: "Number sense, pattern recognition, scientific reasoning.",
    labelX: 45, labelY: 158 },
  { id: "spatial", key: "Spatial-Visual", name: "Spatial", emoji: "🎯",
    cx: 322, cy: 158, rx: 19, ry: 19, color: "#480CA8",
    lobe: "Right Parietal Lobe",
    desc: "Mental rotation, navigation, design thinking.",
    labelX: 355, labelY: 158 },
  { id: "emotional", key: "Emotional", name: "Emotional", emoji: "❤️",
    cx: 200, cy: 148, rx: 22, ry: 22, color: "#E63946",
    lobe: "Limbic System (Amygdala)",
    desc: "Emotional intelligence, empathy, self-awareness.",
    labelX: 200, labelY: 115 },
  { id: "musical", key: "Musical-Rhythmic", name: "Musical", emoji: "🎵",
    cx: 100, cy: 220, rx: 18, ry: 18, color: "#FB5607",
    lobe: "Left Temporal (Auditory Cortex)",
    desc: "Rhythm, melody, beat & pitch.",
    labelX: 65, labelY: 220 },
  { id: "social", key: "Interpersonal", name: "Social", emoji: "🤝",
    cx: 300, cy: 220, rx: 18, ry: 18, color: "#06D6A0",
    lobe: "Right Temporal Lobe",
    desc: "Reading social cues, cooperation, leadership.",
    labelX: 335, labelY: 220 },
  { id: "bodily", key: "Bodily-Kinesthetic", name: "Bodily", emoji: "🏃",
    cx: 72, cy: 285, rx: 18, ry: 18, color: "#2DC653",
    lobe: "Motor Cortex & Cerebellum",
    desc: "Motor skills, body awareness, physical intelligence.",
    labelX: 35, labelY: 285 },
  { id: "intrapersonal", key: "Intrapersonal", name: "Self", emoji: "🧘",
    cx: 200, cy: 260, rx: 18, ry: 18, color: "#118AB2",
    lobe: "Default Mode Network",
    desc: "Self-knowledge, mindfulness, reflective thinking.",
    labelX: 200, labelY: 230 },
  { id: "naturalist", key: "Naturalist", name: "Nature", emoji: "🌿",
    cx: 328, cy: 285, rx: 18, ry: 18, color: "#06D6A0",
    lobe: "Right Cerebellum",
    desc: "Pattern recognition in nature, categorisation.",
    labelX: 365, labelY: 285 },
  { id: "existential", key: "Existential", name: "Wonder", emoji: "✨",
    cx: 140, cy: 320, rx: 16, ry: 16, color: "#6A4C93",
    lobe: "Left Occipital",
    desc: "Deep questioning, wonder, philosophy.",
    labelX: 100, labelY: 320 },
  { id: "digital", key: "Digital-Technological", name: "Digital", emoji: "💻",
    cx: 260, cy: 320, rx: 16, ry: 16, color: "#4CC9F0",
    lobe: "Right Occipital",
    desc: "Computational thinking, systems understanding.",
    labelX: 300, labelY: 320 },
  { id: "pronunciation", key: "Pronunciation", name: "Speech", emoji: "👅",
    cx: 55, cy: 180, rx: 17, ry: 17, color: "#FF6B9D",
    lobe: "Broca's & Wernicke's Areas",
    desc: "Articulation, phonological awareness, speech clarity.",
    labelX: 20, labelY: 180 },
  { id: "coordination", key: "Coordination", name: "Coordination", emoji: "🤹",
    cx: 340, cy: 228, rx: 17, ry: 17, color: "#FFD166",
    lobe: "Cerebellum & Basal Ganglia",
    desc: "Hand-eye coordination, finger dexterity.",
    labelX: 375, labelY: 228 },
] as const;

const MAX_SCORE = 20;

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
        {/* Abstract brain-like gradient background (no external image dependency) */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 50% 50%, #1a2744 0%, transparent 70%),
              radial-gradient(ellipse 50% 40% at 30% 40%, #2d1b4e 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 70% 40%, #1e3a5f 0%, transparent 50%)`,
          }}
        />

        {/* SVG overlay */}
        <svg
          viewBox="0 0 400 360"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
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
            <style>{`
              @keyframes abDash { from { stroke-dashoffset: 4 } to { stroke-dashoffset: 0 } }
              @keyframes abPulse { 0%, 100% { opacity: 0.8 } 50% { opacity: 0.48 } }
            `}</style>
          </defs>

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

            const fillOp = isHighlighted ? 0.285 + pct * 0.2 : isActive ? 0.104 + pct * 0.18 : 0;
            const strokeOpacity = isHighlighted ? 0.8 : isActive ? 0.4 : 0;

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
                {(isActive || isHighlighted) && (
                  <ellipse
                    cx={region.cx}
                    cy={region.cy}
                    rx={region.rx}
                    ry={region.ry}
                    fill={region.color}
                    opacity={isHighlighted ? 0.25 : 0.076 + pct * 0.18}
                    filter="url(#abSoft)"
                    style={isHighlighted ? undefined : { animation: `abPulse ${3.2 + idx * 0.2}s ease-in-out infinite` }}
                  />
                )}
                <ellipse
                  cx={region.cx}
                  cy={region.cy}
                  rx={region.rx}
                  ry={region.ry}
                  fill={region.color}
                  fillOpacity={fillOp}
                  stroke={region.color}
                  strokeWidth={isHighlighted ? 2.5 : isActive ? 2.2 : 1}
                  strokeOpacity={strokeOpacity}
                  filter={isHighlighted ? "url(#abGlow)" : undefined}
                  style={{ transition: "fill-opacity 0.7s, stroke-width 0.2s" }}
                />
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
          {selected !== null ? "Tap region again to deselect" : "Hover or tap a brain region to explore"}
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

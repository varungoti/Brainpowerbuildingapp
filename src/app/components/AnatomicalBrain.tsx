import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import brainBase from "../../assets/brain-progress-base.png";
import {
  BRAIN_REGION_CONNECTIONS,
  BRAIN_REGIONS,
  BRAIN_REGION_VISUALS,
  MAX_BRAIN_REGION_SCORE,
  type BrainRegionBounds,
  type BrainRevealDirection,
} from "../data/brainRegions";

// ─── Background ────────────────────────────────────────────────────────────
const BG = "#0b0e1d";

function getRevealRect(bounds: BrainRegionBounds, revealFrom: BrainRevealDirection, pct: number) {
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
                {BRAIN_REGION_VISUALS[region.id].paths.map((path, idx) => (
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
          {BRAIN_REGION_CONNECTIONS.map(([a, b], i) => {
            const ra = BRAIN_REGIONS[a];
            const rb = BRAIN_REGIONS[b];
            const sa = (scores[ra.key] ?? 0) / MAX_BRAIN_REGION_SCORE;
            const sb = (scores[rb.key] ?? 0) / MAX_BRAIN_REGION_SCORE;
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
            const pct = Math.min(1, score / MAX_BRAIN_REGION_SCORE);
            const isSel = selected === idx;
            const isHov = hovered === idx;
            const isActive = pct > 0;
            const isHighlighted = isSel || isHov;
            const visual = BRAIN_REGION_VISUALS[region.id];
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
            const pct = Math.round(Math.min(100, (score / MAX_BRAIN_REGION_SCORE) * 100));
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
          const pct = Math.min(100, (score / MAX_BRAIN_REGION_SCORE) * 100);
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
                      {score}/{MAX_BRAIN_REGION_SCORE}
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

export { BRAIN_REGIONS as ANATOMICAL_REGIONS, MAX_BRAIN_REGION_SCORE as ANATOMICAL_MAX_SCORE };

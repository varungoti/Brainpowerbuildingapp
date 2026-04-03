import React, { useCallback, useEffect, useRef, useState } from "react";
import brainGuide from "@/assets/Coloured Brain map.png";
import { BrainPanel } from "@/components/brain/BrainPanel";
import { BrainTooltip } from "@/components/brain/BrainTooltip";
import {
  BRAIN_REGION_CONNECTIONS,
  BRAIN_REGION_VISUALS,
  BRAIN_REGIONS,
  MAX_BRAIN_REGION_SCORE,
} from "@/lib/brainRegions";

type Props = {
  scores: Record<string, number>;
  className?: string;
};

const VIEW_WIDTH = 380;
const VIEW_HEIGHT = 320;
const PIXEL_COUNT = VIEW_WIDTH * VIEW_HEIGHT;
const EASE_FACTOR = 0.08;
const EASE_THRESHOLD = 0.002;

const COLOR_MAP = [
  { rgb: [242, 176, 188], id: "executive" },
  { rgb: [191, 239, 242], id: "linguistic" },
  { rgb: [203, 184, 244], id: "creative" },
  { rgb: [217, 221, 103], id: "logical" },
  { rgb: [188, 202, 116], id: "spatial" },
  { rgb: [246, 168, 166], id: "emotional" },
  { rgb: [240, 179, 127], id: "musical" },
  { rgb: [148, 229, 92], id: "social" },
  { rgb: [122, 105, 232], id: "bodily" },
  { rgb: [203, 132, 203], id: "intrapersonal" },
  { rgb: [174, 238, 212], id: "naturalist" },
  { rgb: [217, 139, 224], id: "existential" },
  { rgb: [232, 214, 206], id: "digital" },
  { rgb: [240, 139, 154], id: "pronunciation" },
  { rgb: [199, 211, 119], id: "coordination" },
] as const;

const REGION_INDEX_BY_ID: ReadonlyMap<string, number> = new Map(
  COLOR_MAP.map((c, i) => [c.id as string, i]),
);

const REGION_KEY_BY_INDEX: (string | null)[] = COLOR_MAP.map((c) => {
  const region = BRAIN_REGIONS.find((r) => r.id === c.id);
  return region?.key ?? null;
});

const NEIGHBOR_OFFSETS = [
  [0, 0],
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
  [-4, -4],
  [4, -4],
  [-4, 4],
  [4, 4],
] as const;

function clampByte(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : (v + 0.5) | 0;
}

function luminance(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function getClosestRegion(r: number, g: number, b: number): string | null {
  let minDist = Infinity;
  let closest: string | null = null;
  for (const c of COLOR_MAP) {
    const dr = r - c.rgb[0];
    const dg = g - c.rgb[1];
    const db = b - c.rgb[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDist && dist < 5000) {
      minDist = dist;
      closest = c.id;
    }
  }
  return closest;
}

function getCanvasPoint(
  event: React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(
    (event.clientX - rect.left) * (VIEW_WIDTH / rect.width),
  );
  const y = Math.floor(
    (event.clientY - rect.top) * (VIEW_HEIGHT / rect.height),
  );
  return {
    x: Math.max(0, Math.min(VIEW_WIDTH - 1, x)),
    y: Math.max(0, Math.min(VIEW_HEIGHT - 1, y)),
  };
}

function buildRegionPaths(): Map<string, Path2D> {
  const map = new Map<string, Path2D>();
  for (const [id, visual] of Object.entries(BRAIN_REGION_VISUALS)) {
    const combined = new Path2D();
    for (const pathStr of visual.paths) {
      combined.addPath(new Path2D(pathStr));
    }
    map.set(id, combined);
  }
  return map;
}

export function BrainCanvas({ scores, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorDataRef = useRef<Uint8ClampedArray | null>(null);
  const grayDataRef = useRef<Uint8ClampedArray | null>(null);
  const pixelRegionMapRef = useRef<Int16Array | null>(null);
  const regionPathsRef = useRef<Map<string, Path2D> | null>(null);
  const animRef = useRef(0);

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const hoveredRef = useRef(hovered);
  const selectedRef = useRef(selected);
  const scoresRef = useRef(scores);
  hoveredRef.current = hovered;
  selectedRef.current = selected;
  scoresRef.current = scores;

  const animatedBlends = useRef(new Float32Array(COLOR_MAP.length));

  const resolveRegionFromPoint = useCallback(
    (x: number, y: number): string | null => {
      const regionMap = pixelRegionMapRef.current;
      const colorData = colorDataRef.current;
      if (!regionMap || !colorData) return null;

      const votes = new Map<string, number>();
      for (const [dx, dy] of NEIGHBOR_OFFSETS) {
        const sx = Math.max(0, Math.min(VIEW_WIDTH - 1, x + dx));
        const sy = Math.max(0, Math.min(VIEW_HEIGHT - 1, y + dy));
        const idx = regionMap[sy * VIEW_WIDTH + sx];
        if (idx >= 0) {
          const id = COLOR_MAP[idx]?.id;
          if (id) votes.set(id, (votes.get(id) ?? 0) + 1);
        }
      }

      let bestId: string | null = null;
      let bestVotes = 0;
      for (const [id, count] of votes.entries()) {
        if (count > bestVotes) {
          bestVotes = count;
          bestId = id;
        }
      }
      if (bestId) return bestId;

      const off = (y * VIEW_WIDTH + x) * 4;
      return getClosestRegion(
        colorData[off],
        colorData[off + 1],
        colorData[off + 2],
      );
    },
    [],
  );

  useEffect(() => {
    regionPathsRef.current = buildRegionPaths();

    const img = new Image();
    img.src = brainGuide;
    img.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = VIEW_WIDTH;
      offscreen.height = VIEW_HEIGHT;
      const octx = offscreen.getContext("2d");
      if (!octx) return;

      octx.drawImage(img, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      const imageData = octx.getImageData(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      const colorPixels = new Uint8ClampedArray(imageData.data);
      const grayPixels = new Uint8ClampedArray(imageData.data.length);
      const regionMap = new Int16Array(PIXEL_COUNT).fill(-1);

      for (let i = 0; i < PIXEL_COUNT; i++) {
        const off = i * 4;
        const r = colorPixels[off];
        const g = colorPixels[off + 1];
        const b = colorPixels[off + 2];
        const a = colorPixels[off + 3];

        const lum = luminance(r, g, b);
        grayPixels[off] = clampByte(lum * 0.96 + 6);
        grayPixels[off + 1] = clampByte(lum * 0.95 + 5);
        grayPixels[off + 2] = clampByte(lum * 0.93 + 8);
        grayPixels[off + 3] = a;

        if (a < 10) continue;
        const regionId = getClosestRegion(r, g, b);
        if (regionId) {
          regionMap[i] = REGION_INDEX_BY_ID.get(regionId) ?? -1;
        }
      }

      colorDataRef.current = colorPixels;
      grayDataRef.current = grayPixels;
      pixelRegionMapRef.current = regionMap;
      setReady(true);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const colorData = colorDataRef.current;
    const grayData = grayDataRef.current;
    const regionMap = pixelRegionMapRef.current;
    const regionPaths = regionPathsRef.current;
    if (!canvas || !colorData || !grayData || !regionMap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const blends = animatedBlends.current;
    let running = true;

    const draw = () => {
      if (!running) return;

      const curScores = scoresRef.current;
      const hov = hoveredRef.current;
      const sel = selectedRef.current;

      for (let ri = 0; ri < COLOR_MAP.length; ri++) {
        const key = REGION_KEY_BY_INDEX[ri];
        const target = key
          ? Math.max(
              0,
              Math.min(1, (curScores[key] ?? 0) / MAX_BRAIN_REGION_SCORE),
            )
          : 0;
        const diff = target - blends[ri];
        if (Math.abs(diff) > EASE_THRESHOLD) {
          blends[ri] += diff * EASE_FACTOR;
        } else {
          blends[ri] = target;
        }
      }

      const buffer = new Uint8ClampedArray(grayData.length);

      for (let i = 0; i < PIXEL_COUNT; i++) {
        const off = i * 4;
        const ri = regionMap[i];

        if (ri < 0) {
          buffer[off] = grayData[off];
          buffer[off + 1] = grayData[off + 1];
          buffer[off + 2] = grayData[off + 2];
          buffer[off + 3] = grayData[off + 3];
          continue;
        }

        const regionId = COLOR_MAP[ri]?.id;
        let blend = blends[ri];
        const isHov = regionId === hov;
        const isSel = regionId === sel;

        if (isHov) blend = Math.min(1, blend + 0.20);
        if (isSel) blend = Math.min(1, blend + 0.28);

        buffer[off] = clampByte(
          grayData[off] + (colorData[off] - grayData[off]) * blend,
        );
        buffer[off + 1] = clampByte(
          grayData[off + 1] +
            (colorData[off + 1] - grayData[off + 1]) * blend,
        );
        buffer[off + 2] = clampByte(
          grayData[off + 2] +
            (colorData[off + 2] - grayData[off + 2]) * blend,
        );
        buffer[off + 3] = colorData[off + 3];

        if (isHov || isSel) {
          const boost = isSel ? 18 : 12;
          buffer[off] = clampByte(buffer[off] + boost);
          buffer[off + 1] = clampByte(buffer[off + 1] + boost);
          buffer[off + 2] = clampByte(buffer[off + 2] + boost);
        }
      }

      ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      ctx.putImageData(new ImageData(buffer, VIEW_WIDTH, VIEW_HEIGHT), 0, 0);

      const now = performance.now();
      for (const [srcIdx, tgtIdx] of BRAIN_REGION_CONNECTIONS) {
        const src = BRAIN_REGIONS[srcIdx];
        const tgt = BRAIN_REGIONS[tgtIdx];
        const srcB = blends[REGION_INDEX_BY_ID.get(src.id) ?? 0] ?? 0;
        const tgtB = blends[REGION_INDEX_BY_ID.get(tgt.id) ?? 0] ?? 0;
        const intensity = Math.max(srcB, tgtB);
        if (intensity <= 0.02) continue;

        const highlighted =
          hov === src.id ||
          hov === tgt.id ||
          sel === src.id ||
          sel === tgt.id;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(src.cx, src.cy);
        ctx.lineTo(tgt.cx, tgt.cy);
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = now / 90;
        ctx.lineWidth = highlighted ? 2.2 : 0.8 + intensity;
        ctx.strokeStyle = highlighted
          ? "rgba(15,23,42,0.55)"
          : `rgba(148,163,184,${(0.12 + intensity * 0.35).toFixed(2)})`;
        ctx.stroke();
        ctx.restore();
      }

      if (regionPaths) {
        for (const region of BRAIN_REGIONS) {
          const ri = REGION_INDEX_BY_ID.get(region.id);
          if (ri === undefined) continue;
          const blend = blends[ri];
          const isHov = hov === region.id;
          const isSel = sel === region.id;
          if (blend <= 0.02 && !isHov && !isSel) continue;

          const path = regionPaths.get(region.id);
          if (!path) continue;

          const [cr, cg, cb] = COLOR_MAP[ri].rgb;

          ctx.save();
          if (isHov || isSel) {
            ctx.shadowBlur = isSel ? 22 : 16;
            ctx.shadowColor = `rgba(${cr},${cg},${cb},${isSel ? 0.72 : 0.52})`;
            ctx.lineWidth = isSel ? 3.2 : 2.4;
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.88)`;
          } else {
            ctx.shadowBlur = 4 + blend * 10;
            ctx.shadowColor = `rgba(${cr},${cg},${cb},${(0.18 + blend * 0.32).toFixed(2)})`;
            ctx.lineWidth = 1 + blend * 1.4;
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(0.25 + blend * 0.45).toFixed(2)})`;
          }
          ctx.stroke(path);
          ctx.restore();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [ready]);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (event.pointerType === "touch") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getCanvasPoint(event, canvas);
      setHovered(resolveRegionFromPoint(x, y));
    },
    [resolveRegionFromPoint],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getCanvasPoint(event, canvas);
      const regionId = resolveRegionFromPoint(x, y);
      setHovered(regionId);
      if (regionId) {
        setSelected((c) => (c === regionId ? null : regionId));
      }
    },
    [resolveRegionFromPoint],
  );

  return (
    <div
      className={`relative h-[400px] overflow-hidden rounded-[28px] border border-slate-200 bg-gray-50 shadow-xl ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.95),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(191,219,254,0.35),transparent_35%),linear-gradient(135deg,#f8fafc,#eef2ff_45%,#f8fafc)]" />

      <canvas
        ref={canvasRef}
        width={VIEW_WIDTH}
        height={VIEW_HEIGHT}
        className="relative z-10 h-full w-full touch-manipulation"
        style={{ cursor: hovered ? "pointer" : "default" }}
        role="img"
        aria-label="Brain Intelligence Map"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovered(null)}
        onPointerDown={handlePointerDown}
      />

      {!ready && (
        <div className="absolute inset-0 z-0 animate-pulse bg-slate-100" />
      )}

      <BrainTooltip hoveredId={hovered} scores={scores} />
      <BrainPanel
        selectedId={selected}
        scores={scores}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

import React, { useCallback, useEffect, useRef, useState } from "react";
import brainGuide from "@/assets/Coloured Brain map.png";
import { BrainPanel } from "@/components/brain/BrainPanel";
import { BrainTooltip } from "@/components/brain/BrainTooltip";
import {
  BrainSvgOverlay,
  OVERLAY_VIEW_HEIGHT,
  OVERLAY_VIEW_WIDTH,
} from "@/components/brain/BrainSvgOverlay";
import {
  BRAIN_REGION_CONNECTIONS,
  BRAIN_REGIONS,
  MAX_BRAIN_REGION_SCORE,
} from "@/lib/brainRegions";

type Props = {
  scores: Record<string, number>;
  className?: string;
};

type Viewport = { scale: number; x: number; y: number };
type PointerState = { clientX: number; clientY: number };
type PanState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
};
type PinchState = {
  startDistance: number;
  startScale: number;
  startCenterX: number;
  startCenterY: number;
  originX: number;
  originY: number;
};

const VIEW_WIDTH = OVERLAY_VIEW_WIDTH;
const VIEW_HEIGHT = OVERLAY_VIEW_HEIGHT;
// Internal supersampling factor — we sample the source PNG and animate at 2x
// the SVG viewbox so the brain renders crisply on retina displays without
// blowing up the per-frame pixel work too much. Hit-test paths still live in
// the un-scaled SVG overlay so coordinates stay backwards-compatible.
const SUPERSAMPLE = 2;
const RENDER_WIDTH = VIEW_WIDTH * SUPERSAMPLE;
const RENDER_HEIGHT = VIEW_HEIGHT * SUPERSAMPLE;
const PIXEL_COUNT = RENDER_WIDTH * RENDER_HEIGHT;
const EASE_FACTOR = 0.08;
const EASE_THRESHOLD = 0.002;
const MIN_SCALE = 1;
const MAX_SCALE = 3.2;
// Even at 0 coverage we leave a soft tint of each region's true color so the
// brain reads as an anatomical illustration instead of a flat gray blob.
const BASELINE_TINT = 0.32;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/**
 * Single source of truth for region → RGB mapping. Previously this lived as a
 * duplicated COLOR_MAP literal inside BrainCanvas, which was easy to drift from
 * BRAIN_REGIONS.color. Deriving it here removes that duplication entirely.
 */
const REGION_RGB: [number, number, number][] = BRAIN_REGIONS.map((r) =>
  hexToRgb(r.color),
);

const REGION_INDEX_BY_ID: ReadonlyMap<string, number> = new Map(
  BRAIN_REGIONS.map((r, i) => [r.id, i]),
);

const REGION_KEY_BY_INDEX: string[] = BRAIN_REGIONS.map((r) => r.key);

function clampByte(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : (v + 0.5) | 0;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function luminance(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function getPointerDistance(a: PointerState, b: PointerState) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function getPointerMidpoint(a: PointerState, b: PointerState) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

/** Nearest-color lookup for the painter's pixel → region map. Hit-testing is
 *  handled by the SVG overlay and never calls this. */
function getClosestRegionIndex(r: number, g: number, b: number): number {
  let minDist = Infinity;
  let closest = -1;
  for (let i = 0; i < REGION_RGB.length; i++) {
    const [rr, gg, bb] = REGION_RGB[i];
    const dr = r - rr;
    const dg = g - gg;
    const db = b - bb;
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDist && dist < 5000) {
      minDist = dist;
      closest = i;
    }
  }
  return closest;
}

export function BrainCanvas({ scores, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorDataRef = useRef<Uint8ClampedArray | null>(null);
  const grayDataRef = useRef<Uint8ClampedArray | null>(null);
  const pixelRegionMapRef = useRef<Int16Array | null>(null);
  const animRef = useRef(0);
  const pointersRef = useRef<Map<number, PointerState>>(new Map());
  const panRef = useRef<PanState | null>(null);
  const pinchRef = useRef<PinchState | null>(null);

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ scale: MIN_SCALE, x: 0, y: 0 });

  const hoveredRef = useRef(hovered);
  const selectedRef = useRef(selected);
  const scoresRef = useRef(scores);
  const viewportRef = useRef(viewport);
  hoveredRef.current = hovered;
  selectedRef.current = selected;
  scoresRef.current = scores;
  viewportRef.current = viewport;

  const animatedBlends = useRef(new Float32Array(BRAIN_REGIONS.length));

  const constrainViewport = useCallback((next: Viewport): Viewport => {
    const canvas = canvasRef.current;
    const scale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
    if (!canvas) return { scale, x: next.x, y: next.y };

    const baseWidth = canvas.offsetWidth || canvas.clientWidth || VIEW_WIDTH;
    const baseHeight = canvas.offsetHeight || canvas.clientHeight || VIEW_HEIGHT;
    const maxX = Math.max(0, ((baseWidth * scale) - baseWidth) / 2 + 24);
    const maxY = Math.max(0, ((baseHeight * scale) - baseHeight) / 2 + 24);

    return { scale, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }, []);

  const updateViewport = useCallback(
    (recipe: (prev: Viewport) => Viewport) => {
      setViewport((prev) => constrainViewport(recipe(prev)));
    },
    [constrainViewport],
  );

  useEffect(() => {
    const img = new Image();
    img.src = brainGuide;
    img.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = RENDER_WIDTH;
      offscreen.height = RENDER_HEIGHT;
      const octx = offscreen.getContext("2d");
      if (!octx) return;

      // Hi-quality downscale from the 1024-wide source asset → supersampled
      // canvas so anti-aliased edges of each region stay crisp. Clear first
      // so any alpha=0 source pixels stay alpha=0 (no black bleeding into the
      // downstream gray map at the silhouette edges).
      octx.clearRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = "high";
      // Letterbox-fit the source into the supersampled canvas so we honour the
      // PNG's natural aspect ratio instead of squashing it. Anything outside
      // the fitted rect stays transparent.
      const srcAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
      const dstAspect = RENDER_WIDTH / RENDER_HEIGHT;
      let drawW = RENDER_WIDTH;
      let drawH = RENDER_HEIGHT;
      if (srcAspect > dstAspect) {
        drawH = Math.round(RENDER_WIDTH / srcAspect);
      } else {
        drawW = Math.round(RENDER_HEIGHT * srcAspect);
      }
      const dx = Math.round((RENDER_WIDTH - drawW) / 2);
      const dy = Math.round((RENDER_HEIGHT - drawH) / 2);
      octx.drawImage(img, dx, dy, drawW, drawH);
      const imageData = octx.getImageData(0, 0, RENDER_WIDTH, RENDER_HEIGHT);
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
        // Treat the source PNG's near-black background as transparent — some
        // versions of the asset ship with a flat black canvas and we never
        // want that as part of the rendered brain.
        const max = Math.max(r, g, b);
        const isBackground = a < 10 || (lum < 22 && max < 28);
        if (isBackground) {
          grayPixels[off] = 0;
          grayPixels[off + 1] = 0;
          grayPixels[off + 2] = 0;
          grayPixels[off + 3] = 0;
          colorPixels[off + 3] = 0;
          continue;
        }

        // Warmer "anatomical" gray — slightly pink-tan instead of flat gray
        // so the cerebellum and brainstem look like real tissue at 0 coverage.
        grayPixels[off] = clampByte(lum * 0.92 + 18);
        grayPixels[off + 1] = clampByte(lum * 0.88 + 14);
        grayPixels[off + 2] = clampByte(lum * 0.86 + 16);
        grayPixels[off + 3] = a;

        const idx = getClosestRegionIndex(r, g, b);
        if (idx >= 0) regionMap[i] = idx;
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

      for (let ri = 0; ri < BRAIN_REGIONS.length; ri++) {
        const key = REGION_KEY_BY_INDEX[ri];
        const target = Math.max(
          0,
          Math.min(1, (curScores[key] ?? 0) / MAX_BRAIN_REGION_SCORE),
        );
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
          // Non-region pixels (cerebellum, brain stem, anti-aliased edges)
          // stay visible as warm anatomical gray instead of being zeroed —
          // that's what was making the brain read as a featureless blob.
          buffer[off] = grayData[off];
          buffer[off + 1] = grayData[off + 1];
          buffer[off + 2] = grayData[off + 2];
          buffer[off + 3] = grayData[off + 3];
          continue;
        }

        // Always show some color so each region is identifiable from day 1.
        const blend = Math.min(1, BASELINE_TINT + blends[ri] * (1 - BASELINE_TINT));

        buffer[off] = clampByte(grayData[off] + (colorData[off] - grayData[off]) * blend);
        buffer[off + 1] = clampByte(
          grayData[off + 1] + (colorData[off + 1] - grayData[off + 1]) * blend,
        );
        buffer[off + 2] = clampByte(
          grayData[off + 2] + (colorData[off + 2] - grayData[off + 2]) * blend,
        );
        buffer[off + 3] = colorData[off + 3];
      }

      ctx.clearRect(0, 0, RENDER_WIDTH, RENDER_HEIGHT);
      ctx.putImageData(new ImageData(buffer, RENDER_WIDTH, RENDER_HEIGHT), 0, 0);

      // Connection overlays use the SVG viewbox coordinate space — scale up to
      // the supersampled canvas. Path widths are also scaled to look identical
      // on screen regardless of render resolution.
      ctx.save();
      ctx.scale(SUPERSAMPLE, SUPERSAMPLE);
      const now = performance.now();
      for (const [srcIdx, tgtIdx] of BRAIN_REGION_CONNECTIONS) {
        const src = BRAIN_REGIONS[srcIdx];
        const tgt = BRAIN_REGIONS[tgtIdx];
        const srcB = blends[REGION_INDEX_BY_ID.get(src.id) ?? 0] ?? 0;
        const tgtB = blends[REGION_INDEX_BY_ID.get(tgt.id) ?? 0] ?? 0;
        const intensity = Math.max(srcB, tgtB);
        if (intensity <= 0.02) continue;

        const highlighted =
          hov === src.id || hov === tgt.id || sel === src.id || sel === tgt.id;

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
      }
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [ready]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      setViewport((prev) => constrainViewport(prev));
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [constrainViewport]);

  // ── Pan / pinch only. Hover & select live on the SVG overlay. ───────────────
  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const currentPointer = pointersRef.current.get(event.pointerId);
      if (currentPointer) {
        pointersRef.current.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }

      if (pointersRef.current.size >= 2 && pinchRef.current) {
        event.preventDefault();
        const [first, second] = Array.from(pointersRef.current.values());
        const midpoint = getPointerMidpoint(first, second);
        const distance = getPointerDistance(first, second);
        const pinch = pinchRef.current;
        const nextScale = clamp(
          pinch.startScale * (distance / Math.max(1, pinch.startDistance)),
          MIN_SCALE,
          MAX_SCALE,
        );

        updateViewport(() => ({
          scale: nextScale,
          x: pinch.originX + (midpoint.x - pinch.startCenterX),
          y: pinch.originY + (midpoint.y - pinch.startCenterY),
        }));
        return;
      }

      const pan = panRef.current;
      const isDragging =
        !!pan &&
        pan.pointerId === event.pointerId &&
        (event.pointerType === "touch" || event.buttons === 1) &&
        viewportRef.current.scale > MIN_SCALE + 0.001;

      if (isDragging) {
        event.preventDefault();
        updateViewport((prev) => ({
          scale: prev.scale,
          x: pan.originX + (event.clientX - pan.startClientX),
          y: pan.originY + (event.clientY - pan.startClientY),
        }));
      }
    },
    [updateViewport],
  );

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (pointersRef.current.size === 1) {
      panRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: viewportRef.current.x,
        originY: viewportRef.current.y,
      };
    } else if (pointersRef.current.size === 2) {
      const [first, second] = Array.from(pointersRef.current.values());
      const midpoint = getPointerMidpoint(first, second);
      pinchRef.current = {
        startDistance: getPointerDistance(first, second),
        startScale: viewportRef.current.scale,
        startCenterX: midpoint.x,
        startCenterY: midpoint.y,
        originX: viewportRef.current.x,
        originY: viewportRef.current.y,
      };
      panRef.current = null;
    }
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null;
    if (pointersRef.current.size < 2) pinchRef.current = null;
  }, []);

  const handlePointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null;
    if (pointersRef.current.size < 2) pinchRef.current = null;
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!event.ctrlKey && viewportRef.current.scale <= MIN_SCALE) return;
      event.preventDefault();
      const delta = event.deltaY < 0 ? 1.12 : 0.9;
      updateViewport((prev) => ({
        scale: clamp(prev.scale * delta, MIN_SCALE, MAX_SCALE),
        x: prev.x,
        y: prev.y,
      }));
    },
    [updateViewport],
  );

  return (
    <div
      className={`relative h-[360px] overflow-hidden rounded-[28px] bg-transparent sm:h-[420px] ${className}`}
    >
      {/* Soft ambient backdrop — gives the brain a halo without a hard frame.
          Two stacked radial gradients fake a top-light + lavender bounce so
          the illustration reads as 3D on a light background. */}
      <div
        className="absolute inset-0 rounded-[28px]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 38%, rgba(255,255,255,0.85) 0%, rgba(241,239,255,0.6) 50%, rgba(241,239,255,0) 78%), radial-gradient(40% 35% at 75% 18%, rgba(167,139,250,0.18), transparent 70%), radial-gradient(35% 30% at 22% 78%, rgba(96,165,250,0.14), transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0 z-10 flex items-center justify-center p-2 sm:p-3"
        style={{ touchAction: "none" }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onWheel={handleWheel}
      >
        <div
          className="relative block h-auto w-full max-w-full select-none"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: "center center",
            cursor: viewport.scale > MIN_SCALE + 0.001 ? "grab" : "default",
            aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}`,
            // Soft drop shadow lifts the brain off the page; the saturate +
            // contrast tweak gives the colored regions a modeled, "anatomical
            // illustration" feel rather than the raw PNG flatness.
            filter:
              "drop-shadow(0 18px 28px rgba(67,56,202,0.18)) saturate(1.06) contrast(1.04)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={RENDER_WIDTH}
            height={RENDER_HEIGHT}
            className="pointer-events-none block h-full w-full"
            style={{ background: "transparent" }}
            role="img"
            aria-label="Brain Intelligence Map"
          />
          <BrainSvgOverlay
            className="absolute inset-0"
            hoveredId={hovered}
            selectedId={selected}
            onHover={setHovered}
            onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
          />
        </div>
      </div>

      {viewport.scale > MIN_SCALE + 0.001 && (
        <button
          type="button"
          onClick={() => setViewport({ scale: MIN_SCALE, x: 0, y: 0 })}
          className="absolute right-3 top-3 z-20 rounded-full bg-white/88 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur"
        >
          Reset zoom
        </button>
      )}

      {!ready && (
        <div className="absolute inset-0 z-0 animate-pulse rounded-[28px] bg-white/35" />
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

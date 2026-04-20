// ============================================================================
// WCAG 2.1 contrast helpers
// ----------------------------------------------------------------------------
// Used by BrainCanvas surfaces (BrainTooltip, BrainLegend) so that any text
// rendered against a `BrainRegion.color` swatch always meets WCAG AA for
// normal text (4.5:1). Lives here rather than inline so we can unit-test
// every region color and catch regressions when the palette changes.
// ============================================================================

const SLATE_900 = "#0F172A";
const WHITE = "#FFFFFF";

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function parseHex(hex: string): { r: number; g: number; b: number; a: number } {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]+$/.test(raw)) return { r: 0, g: 0, b: 0, a: 1 };
  let r = 0, g = 0, b = 0, a = 1;
  if (raw.length === 3) {
    r = parseInt(raw[0] + raw[0], 16);
    g = parseInt(raw[1] + raw[1], 16);
    b = parseInt(raw[2] + raw[2], 16);
  } else if (raw.length === 6) {
    r = parseInt(raw.slice(0, 2), 16);
    g = parseInt(raw.slice(2, 4), 16);
    b = parseInt(raw.slice(4, 6), 16);
  } else if (raw.length === 8) {
    r = parseInt(raw.slice(0, 2), 16);
    g = parseInt(raw.slice(2, 4), 16);
    b = parseInt(raw.slice(4, 6), 16);
    a = parseInt(raw.slice(6, 8), 16) / 255;
  }
  return { r, g, b, a };
}

function srgbToLinear(channel: number): number {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * WCAG 2.1 relative luminance for an opaque sRGB color.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

/**
 * WCAG 2.1 contrast ratio between two opaque sRGB colors. Result is in
 * `[1, 21]`; 4.5 is the AA threshold for normal text.
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pick `#0F172A` (slate-900) or `#FFFFFF` for text on the given background
 * such that WCAG AA (≥4.5) is met whenever a choice exists. If neither
 * choice meets AA on a pathological background, returns whichever is
 * higher-contrast — the caller is then responsible for darkening the
 * background.
 */
export function getReadableTextOn(bgHex: string): "#0F172A" | "#FFFFFF" {
  const dark = getContrastRatio(bgHex, SLATE_900);
  const light = getContrastRatio(bgHex, WHITE);
  return dark >= light ? SLATE_900 : WHITE;
}

/**
 * Composite a foreground (with optional alpha) over an opaque background and
 * return the resulting opaque hex. Used by the legend pill where the swatch
 * is the region color at 13% alpha sitting on top of the page background.
 */
export function compositeOver(
  fgHex: string,
  bgHex = "#FFFFFF",
): string {
  const fg = parseHex(fgHex);
  const bg = parseHex(bgHex);
  const a = clamp01(fg.a);
  const r = Math.round(fg.r * a + bg.r * (1 - a));
  const g = Math.round(fg.g * a + bg.g * (1 - a));
  const b = Math.round(fg.b * a + bg.b * (1 - a));
  const toHex = (v: number) => v.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mixToward(hex: string, target: "#000000" | "#FFFFFF", t: number): string {
  const c = parseHex(hex);
  const m = parseHex(target);
  const k = clamp01(t);
  const r = Math.round(c.r * (1 - k) + m.r * k);
  const g = Math.round(c.g * (1 - k) + m.g * k);
  const b = Math.round(c.b * (1 - k) + m.b * k);
  const toHex = (v: number) => v.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Returns `{background, color}` such that the pair meets WCAG AA (≥4.5).
 * Algorithm:
 *   1. Decide whether dark text or light text is the better starting point
 *      based on the original background's luminance.
 *   2. If the chosen text passes AA already, return the original pair.
 *   3. Otherwise darken (for light text) or lighten (for dark text) the
 *      background in 5% steps until AA is met. Caps at 60% mix to prevent
 *      pathological backgrounds from collapsing to pure black/white.
 *
 * This is what BrainTooltip and the legend's color-on-color pills should
 * use whenever a region color drives the background.
 */
export function getAccessiblePillStyle(
  bgHex: string,
  threshold = 4.5,
): { background: string; color: "#0F172A" | "#FFFFFF" } {
  const useLight = relativeLuminance(bgHex) < 0.45;
  const color: "#0F172A" | "#FFFFFF" = useLight ? "#FFFFFF" : "#0F172A";
  const towards: "#000000" | "#FFFFFF" = useLight ? "#000000" : "#FFFFFF";

  let background = bgHex;
  for (let step = 0; step <= 12; step++) {
    if (getContrastRatio(color, background) >= threshold) {
      return { background, color };
    }
    background = mixToward(bgHex, towards, (step + 1) * 0.05);
  }
  return { background, color };
}

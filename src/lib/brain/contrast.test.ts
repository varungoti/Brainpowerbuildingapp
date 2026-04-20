// ============================================================================
// WCAG contrast guarantees for BrainCanvas surfaces.
// ----------------------------------------------------------------------------
// These tests are the regression net for FUTURE_ROADMAP §1.2.I — "WCAG audit
// pass on color contrast in BrainCanvas legend and tooltips." If anyone adds
// a new BrainRegion color or changes the legend/tooltip foregrounds, this
// suite will fail loudly before the change ships.
// ============================================================================

import { describe, expect, it } from "vitest";

import { BRAIN_REGIONS } from "@/lib/brainRegions";
import {
  compositeOver,
  getAccessiblePillStyle,
  getContrastRatio,
  getReadableTextOn,
  relativeLuminance,
} from "./contrast";

const WCAG_AA_NORMAL = 4.5;

describe("contrast primitives", () => {
  it("pure black on pure white = 21:1", () => {
    expect(getContrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("white on white = 1:1", () => {
    expect(getContrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("relativeLuminance is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("compositeOver mixes a 13% alpha tint toward the background", () => {
    // Pure red at 13% alpha over white should be a very light pink.
    const out = compositeOver("#FF000022", "#FFFFFF");
    // R should drop from 255 toward 255*(1)+255*(0) blend... actually
    // R stays near-white because we're mixing 13% red with 87% white.
    // Expected R ≈ 255*0.133 + 255*0.867 = 255 (red contributes 33.9 only
    // because the red channel is 255 and we keep 13% of it; the other 87%
    // comes from the white background's 255 → still 255). G and B drop.
    expect(out).toMatch(/^#FF[0-9A-F]{4}$/);
    // G should drop from 255 by ~13% of (255 - 0) = ~33 → ~222
    const g = parseInt(out.slice(3, 5), 16);
    expect(g).toBeGreaterThan(210);
    expect(g).toBeLessThan(230);
  });
});

describe("getReadableTextOn returns the higher-contrast of slate-900 / white for every region", () => {
  // Note: not every region color admits a 4.5:1 text choice in isolation
  // (e.g. mid-luminance indigo `#7A69E8`). For pills you want
  // getAccessiblePillStyle which adjusts the background; getReadableTextOn
  // is just the "best of two" picker. We assert the picker always returns
  // the higher-contrast of the two options.
  it.each(BRAIN_REGIONS.map((r) => [r.id, r.color] as const))(
    "%s (%s) — picks the higher-contrast text",
    (_id, color) => {
      const fg = getReadableTextOn(color);
      const dark = getContrastRatio("#0F172A", color);
      const light = getContrastRatio("#FFFFFF", color);
      const expected = dark >= light ? "#0F172A" : "#FFFFFF";
      expect(fg).toBe(expected);
    },
  );
});

describe("getAccessiblePillStyle guarantees WCAG AA for every BrainRegion", () => {
  it.each(BRAIN_REGIONS.map((r) => [r.id, r.color] as const))(
    "%s (%s) — pair meets AA",
    (_id, color) => {
      const { background, color: fg } = getAccessiblePillStyle(color);
      expect(getContrastRatio(fg, background)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    },
  );

  it("does not modify a background that already passes AA", () => {
    // Pure black already passes AA against white text.
    const { background, color } = getAccessiblePillStyle("#000000");
    expect(background).toBe("#000000");
    expect(color).toBe("#FFFFFF");
  });

  it("darkens the indigo region until white text reaches 4.5:1", () => {
    const { background, color } = getAccessiblePillStyle("#7A69E8");
    expect(color).toBe("#FFFFFF");
    // The original failed at 4.26; the adjusted background must be darker.
    expect(getContrastRatio("#FFFFFF", "#7A69E8")).toBeLessThan(WCAG_AA_NORMAL);
    expect(getContrastRatio(color, background)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    expect(relativeLuminance(background)).toBeLessThan(relativeLuminance("#7A69E8"));
  });
});

describe("BrainLegend percent pill — slate-700 on the 13% region tint over white", () => {
  // The legend pill background is `region.color + "22"` (alpha = 0x22 = 13%)
  // composited over the surrounding white card. Foreground is slate-700.
  const SLATE_700 = "#334155";
  const ALPHA_HEX = "22";

  it.each(BRAIN_REGIONS.map((r) => [r.id, r.color] as const))(
    "%s (%s) — slate-700 on tint passes AA",
    (_id, color) => {
      const tint = compositeOver(color + ALPHA_HEX, "#FFFFFF");
      const ratio = getContrastRatio(SLATE_700, tint);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    },
  );
});

describe("regression: hard-coded slate-900 on the dark indigo region fails AA", () => {
  it("hard-coded slate-900 on #7A69E8 = below AA — must use getAccessiblePillStyle", () => {
    // Sanity: confirms the bug we're fixing — the previous hard-coded
    // `color: "rgb(15,23,42)"` (slate-900) fails AA on #7A69E8.
    const ratio = getContrastRatio("#0F172A", "#7A69E8");
    expect(ratio).toBeLessThan(WCAG_AA_NORMAL);
  });
});

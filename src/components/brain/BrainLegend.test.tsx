// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrainLegend } from "./BrainLegend";
import { BRAIN_REGIONS } from "@/lib/brainRegions";

describe("BrainLegend", () => {
  it("renders one row per region, each surfacing the intelligence key", () => {
    const { getAllByRole } = render(<BrainLegend scores={{}} />);
    const buttons = getAllByRole("button");
    expect(buttons.length).toBe(BRAIN_REGIONS.length);
    BRAIN_REGIONS.forEach((r) => {
      const match = buttons.find((b) =>
        b.getAttribute("aria-label")?.startsWith(`${r.name} — ${r.key}`),
      );
      expect(match, `missing legend row for ${r.name}`).toBeTruthy();
    });
  });

  it("formats coverage as a percentage of the region's current score", () => {
    const firstKey = BRAIN_REGIONS[0].key;
    const { container } = render(
      <BrainLegend scores={{ [firstKey]: 4 }} />,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    // textContent concatenates with no spaces so we can't rely on \b; look
    // for "20%" directly (score=4 / MAX=20 = 20%) on the first region button.
    expect(buttons[0].textContent).toContain("20%");
    // And every other region still renders at 0% because their scores are absent.
    const zeroCount = buttons.slice(1).filter((b) => b.textContent?.includes("0%")).length;
    expect(zeroCount).toBe(BRAIN_REGIONS.length - 1);
  });

  it("marks the active region as pressed", () => {
    const active = BRAIN_REGIONS[2];
    const { getAllByRole } = render(
      <BrainLegend scores={{}} activeId={active.id} />,
    );
    const pressed = getAllByRole("button").filter(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(pressed.length).toBe(1);
    expect(pressed[0].getAttribute("aria-label")).toContain(active.name);
  });
});

// @vitest-environment jsdom
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrainSvgOverlay } from "./BrainSvgOverlay";
import { BRAIN_REGIONS, BRAIN_REGION_VISUALS } from "@/lib/brainRegions";

function renderOverlay(overrides: Partial<React.ComponentProps<typeof BrainSvgOverlay>> = {}) {
  const onHover = vi.fn();
  const onSelect = vi.fn();
  const utils = render(
    <BrainSvgOverlay
      hoveredId={null}
      selectedId={null}
      onHover={onHover}
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { ...utils, onHover, onSelect };
}

describe("BrainSvgOverlay", () => {
  it("renders one focusable, aria-labeled path per region with overlay geometry", () => {
    const { container } = renderOverlay();
    const paths = container.querySelectorAll("path[data-region-id]");
    const regionsWithVisuals = BRAIN_REGIONS.filter(
      (r) => BRAIN_REGION_VISUALS[r.id]?.paths?.length,
    );
    expect(paths.length).toBe(regionsWithVisuals.length);
    paths.forEach((p) => {
      expect(p.getAttribute("role")).toBe("button");
      expect(p.getAttribute("tabindex")).toBe("0");
      expect(p.getAttribute("aria-label")).toMatch(/ — /);
    });
  });

  it("fires onHover(id) on pointer enter and onHover(null) on leave", () => {
    const { container, onHover } = renderOverlay();
    const first = container.querySelector("path[data-region-id]") as SVGPathElement;
    fireEvent.pointerEnter(first);
    expect(onHover).toHaveBeenCalledWith(first.getAttribute("data-region-id"));
    fireEvent.pointerLeave(first);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it("fires onSelect(id) on click and on Enter/Space key", () => {
    const { container, onSelect } = renderOverlay();
    const paths = Array.from(
      container.querySelectorAll<SVGPathElement>("path[data-region-id]"),
    );
    const first = paths[0];
    fireEvent.click(first);
    expect(onSelect).toHaveBeenCalledWith(first.getAttribute("data-region-id"));

    const second = paths[1];
    fireEvent.keyDown(second, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(second.getAttribute("data-region-id"));

    fireEvent.keyDown(second, { key: " " });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it("paints the selected region with its brand color (non-transparent stroke)", () => {
    const selected = BRAIN_REGIONS[0];
    const { container } = renderOverlay({ selectedId: selected.id });
    const path = container.querySelector<SVGPathElement>(
      `path[data-region-id="${selected.id}"]`,
    );
    expect(path).not.toBeNull();
    expect(path!.getAttribute("stroke")).toBe(selected.color);
    expect(path!.getAttribute("aria-pressed")).toBe("true");
  });
});

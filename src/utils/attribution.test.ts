// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetAttributionForTests,
  captureAttributionFromUrl,
  getFirstTouchAttribution,
  getLastTouchAttribution,
} from "./attribution";

describe("attribution capture", () => {
  beforeEach(() => __resetAttributionForTests());
  afterEach(() => __resetAttributionForTests());

  it("returns null first/last when URL has no UTM params", () => {
    captureAttributionFromUrl("https://app.neurospark.com/?foo=bar");
    expect(getFirstTouchAttribution()).toBeNull();
    expect(getLastTouchAttribution()).toBeNull();
  });

  it("captures utm_* params on first visit", () => {
    captureAttributionFromUrl(
      "https://app.neurospark.com/?utm_source=instagram_reel&utm_medium=short&utm_campaign=daily_shorts",
    );
    const f = getFirstTouchAttribution();
    expect(f).not.toBeNull();
    expect(f!.source).toBe("instagram_reel");
    expect(f!.medium).toBe("short");
    expect(f!.campaign).toBe("daily_shorts");
  });

  it("captures ns_* aliases when utm_* are missing", () => {
    captureAttributionFromUrl(
      "https://app.neurospark.com/?ns_source=BrainStoryShort&ns_medium=video&ns_campaign=daily_shorts",
    );
    const f = getFirstTouchAttribution();
    expect(f!.source).toBe("BrainStoryShort");
    expect(f!.medium).toBe("video");
  });

  it("preserves first-touch across subsequent visits but updates last-touch", () => {
    captureAttributionFromUrl(
      "https://app.neurospark.com/?utm_source=tiktok&utm_campaign=launch",
    );
    captureAttributionFromUrl(
      "https://app.neurospark.com/?utm_source=youtube_short&utm_campaign=clipper",
    );
    expect(getFirstTouchAttribution()!.source).toBe("tiktok");
    expect(getLastTouchAttribution()!.source).toBe("youtube_short");
  });

  it("ignores invalid URLs without throwing", () => {
    expect(() => captureAttributionFromUrl("not-a-url")).not.toThrow();
    expect(getFirstTouchAttribution()).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { captureProductEvent } from "./productAnalytics";

describe("captureProductEvent", () => {
  it("runs without throwing", () => {
    expect(() => captureProductEvent("pack_generate", { pack_size: 3, age_tier: 2 })).not.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { parseFeatureFlagsString } from "./featureFlags";

describe("parseFeatureFlagsString", () => {
  it("returns empty set for empty input", () => {
    expect(parseFeatureFlagsString("").size).toBe(0);
    expect(parseFeatureFlagsString(undefined).size).toBe(0);
  });

  it("parses comma-separated flags", () => {
    const s = parseFeatureFlagsString("FOO, bar ,BAZ");
    expect(s.has("foo")).toBe(true);
    expect(s.has("bar")).toBe(true);
    expect(s.has("baz")).toBe(true);
  });

  it("parses space-separated flags", () => {
    const s = parseFeatureFlagsString("one two three");
    expect(s.has("one")).toBe(true);
    expect(s.has("three")).toBe(true);
  });
});

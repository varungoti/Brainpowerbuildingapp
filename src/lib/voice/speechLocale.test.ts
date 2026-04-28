import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeSpeechLocale } from "./speechLocale";

describe("normalizeSpeechLocale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps bare en to en-US", () => {
    expect(normalizeSpeechLocale("en")).toBe("en-US");
  });

  it("maps bare hi to hi-IN", () => {
    expect(normalizeSpeechLocale("hi")).toBe("hi-IN");
  });

  it("preserves full BCP-47 tags with correct casing", () => {
    expect(normalizeSpeechLocale("en-gb")).toBe("en-GB");
    expect(normalizeSpeechLocale("en_US")).toBe("en-US");
  });

  it("uses navigator.language when bare code has no fixed default region", () => {
    vi.stubGlobal("navigator", { language: "sv-SE" });
    expect(normalizeSpeechLocale("sv")).toBe("sv-SE");
  });

  it("falls back to en-US for empty input when navigator missing", () => {
    vi.stubGlobal("navigator", { language: "" });
    expect(normalizeSpeechLocale("")).toBe("en-US");
    expect(normalizeSpeechLocale(null)).toBe("en-US");
  });
});

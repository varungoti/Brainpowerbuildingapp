import { describe, it, expect } from "vitest";
import { sanitiseObservation } from "./coachMemory";

describe("sanitiseObservation", () => {
  it("strips emails", () => {
    expect(sanitiseObservation("contact me at parent@example.com")).toBe("contact me at [redacted]");
  });
  it("strips phones", () => {
    expect(sanitiseObservation("call +1 415-555-0143 today")).toBe("call [redacted] today");
  });
  it("strips SSN-shaped strings", () => {
    expect(sanitiseObservation("123-45-6789")).toBe("[redacted]");
  });
  it("clamps to 800 chars", () => {
    const long = "a".repeat(2000);
    expect(sanitiseObservation(long).length).toBe(800);
  });
  it("collapses whitespace", () => {
    expect(sanitiseObservation("hello\n\n  world")).toBe("hello world");
  });
});

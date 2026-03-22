import { describe, it, expect } from "vitest";
import { initClientMonitoring, reportClientError } from "./monitoring";

describe("monitoring", () => {
  it("initClientMonitoring does not throw in test / dev", () => {
    expect(() => initClientMonitoring()).not.toThrow();
  });

  it("reportClientError does not throw when Sentry inactive", () => {
    expect(() => reportClientError(new Error("test"), { componentStack: "x" })).not.toThrow();
  });
});

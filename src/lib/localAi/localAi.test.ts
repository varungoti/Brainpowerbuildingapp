// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  _resetRuntimeStatusForTests,
  canUseCloud,
  getLocalRuntimeStatus,
  getProcessingMode,
  hasFeatureConsent,
  hasWebGpu,
  probeWebLlm,
  purgeChildLocalState,
  revokeAiConsent,
  setAiConsent,
  setProcessingMode,
} from "./index";

describe("localAi consent + mode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("default mode is cloud", () => {
    expect(getProcessingMode()).toBe("cloud");
  });

  it("setProcessingMode persists", () => {
    setProcessingMode("on-device");
    expect(getProcessingMode()).toBe("on-device");
  });

  it("no consent → no cloud", () => {
    expect(canUseCloud("child1", "coach")).toBe(false);
  });

  it("granted consent allows cloud unless onDeviceOnly", () => {
    setAiConsent({
      childId: "child1",
      grantedAt: new Date().toISOString(),
      features: ["coach"],
      onDeviceOnly: false,
    });
    expect(canUseCloud("child1", "coach")).toBe(true);
    expect(canUseCloud("child1", "voice-stt")).toBe(false);
  });

  it("onDeviceOnly forbids cloud even with consent", () => {
    setAiConsent({
      childId: "child1",
      grantedAt: new Date().toISOString(),
      features: ["coach"],
      onDeviceOnly: true,
    });
    expect(canUseCloud("child1", "coach")).toBe(false);
    expect(hasFeatureConsent("child1", "coach")).toBe(true);
  });

  it("revoke removes consent", () => {
    setAiConsent({ childId: "c", grantedAt: "x", features: ["coach"], onDeviceOnly: false });
    revokeAiConsent("c");
    expect(canUseCloud("c", "coach")).toBe(false);
  });

  it("purgeChildLocalState removes anything keyed by childId", () => {
    localStorage.setItem("neurospark.scratch.child99", "1");
    localStorage.setItem("neurospark.scratch.child99.b", "2");
    localStorage.setItem("unrelated", "3");
    const purged = purgeChildLocalState("child99");
    expect(purged).toBe(2);
    expect(localStorage.getItem("unrelated")).toBe("3");
  });
});

describe("localAi WebLLM probe", () => {
  beforeEach(() => {
    _resetRuntimeStatusForTests();
    delete (navigator as Navigator & { gpu?: unknown }).gpu;
  });

  it("hasWebGpu returns false when navigator.gpu is missing", () => {
    expect(hasWebGpu()).toBe(false);
  });

  it("hasWebGpu returns true when navigator.gpu is present", () => {
    Object.defineProperty(navigator, "gpu", {
      value: {},
      configurable: true,
    });
    expect(hasWebGpu()).toBe(true);
  });

  it("probeWebLlm reports no-webgpu without WebGPU", async () => {
    const r = await probeWebLlm();
    expect(r.available).toBe(false);
    expect(r.reason).toBe("no-webgpu");
  });

  it("probeWebLlm reports no-package when WebGPU exists but package is absent", async () => {
    Object.defineProperty(navigator, "gpu", {
      value: {},
      configurable: true,
    });
    const r = await probeWebLlm();
    expect(r.available).toBe(false);
    expect(r.reason).toBe("no-package");
  });

  it("getLocalRuntimeStatus marks llmAvailable=false in jsdom and caches", async () => {
    const a = await getLocalRuntimeStatus();
    const b = await getLocalRuntimeStatus();
    expect(a).toBe(b);
    expect(a.llmAvailable).toBe(false);
    expect(a.modelName).toBe("cloud-fallback");
  });
});

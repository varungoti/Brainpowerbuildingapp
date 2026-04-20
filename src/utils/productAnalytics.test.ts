import { describe, it, expect } from "vitest";
import { captureProductEvent } from "./productAnalytics";

describe("captureProductEvent", () => {
  it("runs without throwing for legacy events", () => {
    expect(() => captureProductEvent("pack_generate", { pack_size: 3, age_tier: 2 })).not.toThrow();
  });

  it("accepts the new auth/onboarding/first-activity funnel events", () => {
    // These are pure type-level assertions plus runtime smoke — if the
    // taxonomy regresses (e.g. someone deletes `auth_view`) tsc will fail
    // here before the change ships.
    expect(() => captureProductEvent("auth_view", { screen: "auth", auth_mode: "signup" })).not.toThrow();
    expect(() => captureProductEvent("auth_submit_attempt", { screen: "auth", auth_mode: "login", dwell_ms: 4200 })).not.toThrow();
    expect(() => captureProductEvent("auth_submit_success", { screen: "auth", auth_mode: "login" })).not.toThrow();
    expect(() => captureProductEvent("auth_submit_fail", { screen: "auth", auth_mode: "login", fail_reason: "invalid_credentials" })).not.toThrow();
    expect(() => captureProductEvent("onboard_step_view", { screen: "onboard_child", step: "child" })).not.toThrow();
    expect(() => captureProductEvent("onboard_complete", { screen: "onboard_ready", age_tier: 3 })).not.toThrow();
    expect(() => captureProductEvent("first_activity_open", { screen: "activity_detail", primary_intel: "Bodily-Kinesthetic", region: "frontal" })).not.toThrow();
    expect(() => captureProductEvent("first_activity_complete", { screen: "activity_detail", duration_min: 12 })).not.toThrow();
    expect(() => captureProductEvent("activity_complete", { primary_intel: "Linguistic", duration_min: 7, region: "temporal", is_first_activity: true })).not.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { FULL_SCREEN_VIEWS, getActiveNavTab, getScreenTitle, shouldHideHeader } from "./viewConfig";

describe("viewConfig", () => {
  it("keeps onboarding/auth views in the fullscreen set", () => {
    expect(FULL_SCREEN_VIEWS).toContain("landing");
    expect(FULL_SCREEN_VIEWS).toContain("auth");
    expect(FULL_SCREEN_VIEWS).toContain("onboard_child");
  });

  it("maps navigation aliases for generated packs and profile-owned subpages", () => {
    expect(getActiveNavTab("pack_result")).toBe("generate");
    expect(getActiveNavTab("activity_detail")).toBe("generate");
    expect(getActiveNavTab("legal_info")).toBe("profile");
    expect(getActiveNavTab("know_your_child")).toBe("brain_map");
  });

  it("returns production header/title settings for key screens", () => {
    expect(getScreenTitle("activity_detail")).toBe("Activity Detail");
    expect(getScreenTitle("home")).toBe("NeuroSpark");
    expect(shouldHideHeader("generate")).toBe(true);
    expect(shouldHideHeader("history")).toBe(false);
  });
});

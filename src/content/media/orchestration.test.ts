import { describe, expect, it } from "vitest";
import { ACTIVITIES } from "../../app/data/activities";
import { buildActivityEditorialChecklist, buildMediaPromptPacket } from "./orchestration";

describe("content media orchestration", () => {
  it("builds a prompt packet with evidence and safety sections", () => {
    const activity = ACTIVITIES.find((item) => item.id === "a26")!;
    const packet = buildMediaPromptPacket(activity, "video");

    expect(packet.evidenceAnchors.length).toBeGreaterThan(0);
    expect(packet.safetyConstraints.length).toBeGreaterThan(0);
    expect(packet.prompt).toContain(activity.name);
    expect(packet.prompt).toContain("Safety constraints:");
  });

  it("builds editorial checklist entries for reviewed content", () => {
    const activity = ACTIVITIES.find((item) => item.id === "a16")!;
    const checklist = buildActivityEditorialChecklist(activity);

    expect(checklist.length).toBeGreaterThanOrEqual(4);
    expect(checklist[0]).toMatch(/reviewed status/i);
  });
});

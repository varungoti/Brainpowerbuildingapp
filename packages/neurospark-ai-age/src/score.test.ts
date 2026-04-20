import { describe, it, expect } from "vitest";
import { scoreInteraction, AI_AGE_COMPETENCIES } from "./index";

describe("@neurospark/ai-age scoreInteraction", () => {
  it("returns a delta for every competency", () => {
    const d = scoreInteraction({
      ageMonths: 60,
      durationSec: 240,
      modality: "tactile",
      observed: [],
    });
    for (const c of AI_AGE_COMPETENCIES) expect(d[c.id]).toBeDefined();
  });

  it("rewards observed behaviours", () => {
    const a = scoreInteraction({
      ageMonths: 60,
      durationSec: 240,
      modality: "voice",
      observed: ["self-correction"],
    });
    const b = scoreInteraction({
      ageMonths: 60,
      durationSec: 240,
      modality: "voice",
      observed: [],
    });
    expect(a["executive-function"]).toBeGreaterThan(b["executive-function"]);
  });

  it("transcript metacognitive cues bump meta", () => {
    const a = scoreInteraction({
      ageMonths: 72,
      durationSec: 180,
      modality: "voice",
      observed: [],
      transcript: [
        { from: "adult", text: "How do you know that?" },
        { from: "child", text: "I'm not sure, let me try." },
      ],
    });
    expect(a["metacognitive-self-direction"]).toBeGreaterThan(0);
  });

  it("clamps out-of-range competencies", () => {
    // 18-month-old can't do lateral source eval; should be heavily attenuated
    const young = scoreInteraction({
      ageMonths: 18,
      durationSec: 600,
      modality: "voice",
      observed: ["checks-second-source"],
    });
    const ageAppropriate = scoreInteraction({
      ageMonths: 96,
      durationSec: 600,
      modality: "voice",
      observed: ["checks-second-source"],
    });
    expect(ageAppropriate["lateral-source-evaluation"]).toBeGreaterThan(young["lateral-source-evaluation"]);
  });

  it("modality matters: embodied-mastery higher with tactile than screen", () => {
    const tactile = scoreInteraction({
      ageMonths: 60, durationSec: 300, modality: "tactile",
      observed: ["fine-motor-precision"],
    });
    const screen = scoreInteraction({
      ageMonths: 60, durationSec: 300, modality: "screen",
      observed: ["fine-motor-precision"],
    });
    expect(tactile["embodied-mastery"]).toBeGreaterThan(screen["embodied-mastery"]);
  });

  it("returns zero on zero duration", () => {
    const d = scoreInteraction({
      ageMonths: 60, durationSec: 0, modality: "voice",
      observed: ["self-correction"],
    });
    expect(d["executive-function"]).toBe(0);
  });
});

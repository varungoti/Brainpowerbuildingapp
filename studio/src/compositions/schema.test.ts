import { describe, expect, it } from "vitest";
import { compositionPropsSchema, sceneSchema } from "./schema";

describe("studio composition schema", () => {
  it("scene requires a 0.5–20s duration", () => {
    expect(() => sceneSchema.parse({ duration: 0.4 })).toThrow();
    expect(() => sceneSchema.parse({ duration: 21 })).toThrow();
    expect(() => sceneSchema.parse({ duration: 4 })).not.toThrow();
  });

  it("scene rejects non-URL image/video strings", () => {
    expect(() => sceneSchema.parse({ duration: 4, imageUrl: "not-a-url" })).toThrow();
    expect(() =>
      sceneSchema.parse({ duration: 4, imageUrl: "https://example.com/x.png" }),
    ).not.toThrow();
  });

  it("composition defaults to light variant + empty title/scenes", () => {
    const parsed = compositionPropsSchema.parse({});
    expect(parsed.variant).toBe("light");
    expect(parsed.title).toBe("");
    expect(parsed.scenes).toEqual([]);
  });

  it("composition rejects an unknown variant", () => {
    expect(() =>
      compositionPropsSchema.parse({ variant: "neon" as unknown as "light" }),
    ).toThrow();
  });

  it("composition accepts a fully-formed brief", () => {
    const parsed = compositionPropsSchema.parse({
      title: "Build the AI-age brain",
      subtitle: "60 minutes a week.",
      variant: "dark",
      scenes: [
        { duration: 4, imageUrl: "https://example.com/a.png", motion: "pan-l" },
        { duration: 6, imageUrl: "https://example.com/b.png" },
      ],
      endCta: "Try NeuroSpark free",
    });
    expect(parsed.scenes).toHaveLength(2);
    expect(parsed.scenes[0].motion).toBe("pan-l");
    expect(parsed.endCta).toBe("Try NeuroSpark free");
  });
});
